import type { SessionMessageUser } from "@opencode/client"
import { Command, Plugin, Slot, Style, usePlugin, type MountedSession } from "@opencode/plugin/gui"
import { For, Show, createEffect, createMemo, createSignal, onCleanup, onMount } from "solid-js"
import { Portal } from "solid-js/web"
import css from "./gui.css?inline"

const HISTORY_LIMIT = 10
const clock = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

type Hover = {
  message: SessionMessageUser
  index: number
  rect: DOMRect
  below: boolean
}

function oneLine(text: string) {
  return text.replace(/\s+/g, " ").trim()
}

function formatTime(value: number) {
  return clock.format(new Date(value))
}

function lineWidth(text: string) {
  return 12 + Math.min(6, Math.floor(oneLine(text).length / 12))
}

function usePromptHistory(session: () => MountedSession, limit: number) {
  const [fetched, setFetched] = createSignal<SessionMessageUser[]>([])
  const [revision, setRevision] = createSignal(0)

  const live = createMemo(() => {
    revision()
    const current = session()
    if (!current) return [] as SessionMessageUser[]
    return current.server.data.session.message
      .list(current.id)
      .filter((message): message is SessionMessageUser => message.type === "user")
  })

  const merged = createMemo(() => {
    const byID = new Map<string, SessionMessageUser>()
    for (const message of fetched()) byID.set(message.id, message)
    for (const message of live()) byID.set(message.id, message)
    return [...byID.values()]
      .sort((left, right) => left.time.created - right.time.created)
      .slice(-limit)
  })

  createEffect(() => {
    const current = session()
    if (!current) return

    const connection = current.server
    const controller = new AbortController()
    onCleanup(() => controller.abort())

    void connection.client.message
      .list(
        { sessionID: current.id, limit: 50, order: "desc", type: "user" },
        { signal: controller.signal },
      )
      .then((response) => {
        if (controller.signal.aborted) return
        const rows = response.data
          .filter((message): message is SessionMessageUser => message.type === "user")
          .reverse()
        setFetched(rows)
      })
      .catch(() => {})

    void connection.data.session.message.sync(current.id).catch(() => {})

    const stop = connection.data.listen(({ details }) => {
      if (details.type !== "session.inbox.enqueued") return
      if (details.data.sessionID !== current.id) return
      setRevision((value) => value + 1)
    })
    onCleanup(stop)
  })

  return merged
}

function PromptHeader(props: {
  session: MountedSession
  active: boolean
  compact: boolean
  visible: boolean
}) {
  const ctx = usePlugin()
  const history = usePromptHistory(() => props.session, HISTORY_LIMIT)
  const latest = createMemo(() => history().at(-1))
  const [hover, setHover] = createSignal<Hover>()
  const [anchor, setAnchor] = createSignal({ left: 12, top: 120, height: 320 })

  let anchorEl: HTMLSpanElement | undefined
  let hideTimer: number | undefined

  const measure = () => {
    if (!anchorEl) return
    const scroll = anchorEl.closest(".scroll-view") as HTMLElement | null
    const header = anchorEl.closest(".session-header") as HTMLElement | null
    const main = anchorEl.closest("main") as HTMLElement | null
    const scrollRect = scroll?.getBoundingClientRect()
    const headerRect = header?.getBoundingClientRect()
    const mainRect = main?.getBoundingClientRect()

    // The slot lives in the header's actions area, so its own ancestors do not
    // reliably describe the timeline. `main` is the chat column: use its left
    // edge plus the panel inset, and keep the vertical bounds from the panel.
    let panelEl = anchorEl.parentElement
    while (panelEl) {
      const style = getComputedStyle(panelEl)
      const rect = panelEl.getBoundingClientRect()
      if (
        style.overflow === "hidden" &&
        Number.parseFloat(style.borderRadius) >= 8 &&
        rect.width >= 480 &&
        rect.height >= 300
      ) {
        break
      }
      panelEl = panelEl.parentElement
    }
    const panelRect = panelEl?.getBoundingClientRect() ?? scrollRect ?? mainRect
    if (!panelRect) return

    // The chat column is the child of the app content row that holds the
    // header; its previous sibling is the left sidebar. This is more reliable
    // than any single ancestor class in the desktop layout.
    let chatLeft: number | undefined
    let row = anchorEl.parentElement
    while (row) {
      const style = getComputedStyle(row)
      if (style.display.includes("flex")) {
        const children = Array.from(row.children) as HTMLElement[]
        const index = children.findIndex((child) => child.contains(anchorEl!))
        if (index > 0) {
          const chat = children[index].getBoundingClientRect()
          const sidebar = children[index - 1].getBoundingClientRect()
          if (chat.width >= 600 && chat.height >= 300 && sidebar.width >= 100 && sidebar.width <= 600) {
            chatLeft = chat.left
            break
          }
        }
      }
      row = row.parentElement
    }

    const left = (chatLeft ?? (mainRect ?? panelRect).left) + 4
    const top = (headerRect?.bottom ?? panelRect.top + 56) + 8
    const bottom = panelRect.bottom - 92
    const height = Math.max(140, bottom - top)
    setAnchor({
      left: Math.round(left),
      top: Math.round(top),
      height: Math.round(height),
    })
  }

  const show = (next: Hover) => {
    if (hideTimer !== undefined) window.clearTimeout(hideTimer)
    hideTimer = undefined
    setHover(next)
  }

  const hide = () => {
    hideTimer = window.setTimeout(() => {
      hideTimer = undefined
      setHover(undefined)
    }, 140)
  }

  onMount(() => {
    measure()
    const scroll = anchorEl?.closest(".scroll-view")
    const observer = new ResizeObserver(measure)
    if (scroll) observer.observe(scroll)
    window.addEventListener("resize", measure)
    onCleanup(() => {
      observer.disconnect()
      window.removeEventListener("resize", measure)
      if (hideTimer !== undefined) window.clearTimeout(hideTimer)
    })
  })

  createEffect(() => {
    history().length
    props.active
    props.visible
    requestAnimationFrame(measure)
  })

  const cardStyle = () => {
    const current = hover()
    if (!current) return ""
    const left = current.below
      ? Math.max(8, Math.min(current.rect.left, window.innerWidth - 460))
      : Math.max(8, Math.min(current.rect.right + 10, window.innerWidth - 460))
    const top = current.below
      ? Math.max(8, Math.min(current.rect.bottom + 8, window.innerHeight - 220))
      : Math.max(8, Math.min(current.rect.top - 8, window.innerHeight - 240))
    return `left:${Math.round(left)}px;top:${Math.round(top)}px`
  }

  return (
    <>
      <Show when={props.active && latest()}>
        {(message) => (
          <Show
            when={!props.compact}
            fallback={
              <div
                class="opencode-prompt-bubble opencode-prompt-bubble--compact"
                title={message().text}
                onMouseEnter={(event) =>
                  show({
                    message: message(),
                    index: history().length,
                    rect: event.currentTarget.getBoundingClientRect(),
                    below: true,
                  })
                }
                onMouseLeave={hide}
              />
            }
          >
            <div
              class="opencode-prompt-bubble"
              onMouseEnter={(event) =>
                show({
                  message: message(),
                  index: history().length,
                  rect: event.currentTarget.getBoundingClientRect(),
                  below: true,
                })
              }
              onMouseLeave={hide}
            >
              <span class="opencode-prompt-bubble__label">{ctx.t("bubble.label")}</span>
              <span class="opencode-prompt-bubble__text">{oneLine(message().text)}</span>
            </div>
          </Show>
        )}
      </Show>

      <span ref={(element) => (anchorEl = element)} style={{ display: "none" }} />

      <Portal mount={document.body}>
        <div
          class="opencode-prompt-rail-anchor"
          style={{
            left: `${anchor().left}px`,
            top: `${anchor().top}px`,
            height: `${anchor().height}px`,
            display: props.active && props.visible && history().length > 0 ? "flex" : "none",
          }}
        >
          <div class="opencode-prompt-rail" aria-label={ctx.t("rail.label")}>
            <For each={history()}>
              {(message, index) => (
                <div
                  class="opencode-prompt-rail__line"
                  data-latest={index() === history().length - 1 ? "true" : undefined}
                  style={`--line-width:${lineWidth(message.text)}px`}
                  onMouseEnter={(event) =>
                    show({
                      message,
                      index: index() + 1,
                      rect: event.currentTarget.getBoundingClientRect(),
                      below: false,
                    })
                  }
                  onMouseLeave={hide}
                  onClick={() => void ctx.system.copy(message.text)}
                />
              )}
            </For>
          </div>
        </div>

        <Show when={props.active && hover()}>
          {(current) => (
            <div
              class="opencode-prompt-rail__card"
              style={cardStyle()}
              onMouseEnter={() => show(current())}
              onMouseLeave={hide}
            >
              <div class="opencode-prompt-rail__meta">
                #{current().index} · {formatTime(current().message.time.created)}
              </div>
              <div class="opencode-prompt-rail__text">{current().message.text}</div>
            </div>
          )}
        </Show>
      </Portal>
    </>
  )
}

export default Plugin.define({
  i18n: {
    en: {
      "command.toggle": "Toggle recent prompt rail",
      "command.group": "Prompt",
      "bubble.label": "last prompt",
      "rail.label": "Recent prompts",
    },
    zh: {
      "command.toggle": "切换最近消息栏",
      "command.group": "提示词",
      "bubble.label": "最近消息",
      "rail.label": "最近消息",
    },
  },
  setup(ctx) {
    const [visible, setVisible] = createSignal(true)

    ctx.add(Style, css)
    ctx.add(Command, () => ({
      id: "toggle",
      title: ctx.t("command.toggle"),
      group: ctx.t("command.group"),
      run: () => {
        setVisible((value) => !value)
      },
    }))
    ctx.add(Slot, {
      at: "session.header",
      order: 10,
      render: (input) => (
        <PromptHeader
          session={input.session}
          active={input.active}
          compact={input.compact}
          visible={visible()}
        />
      ),
    })
  },
})
