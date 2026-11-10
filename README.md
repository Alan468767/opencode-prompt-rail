# opencode-prompt-rail

An OpenCode Desktop GUI plugin that adds two small prompt-history widgets to
the session screen:

- A slim vertical rail on the left edge of the chat panel. Each line is one of
  your last 10 prompts. Hover a line to see the full message; click it to copy
  the text. The newest prompt is the blue line.
- A floating "last prompt" bubble in the session header. Hover it to see the
  full text of the message you sent most recently.

The rail can be toggled from the command palette with **Toggle recent prompt
rail**.

## Source

The source lives at:

```text
~/.config/opencode/plugins/prompt-rail
```

It is a local GUI-only plugin built with the OpenCode GUI plugin SDK. The
installed copy is a versioned package in the OpenCode plugin cache.

## Build

```sh
cd ~/.config/opencode/plugins/prompt-rail
npm install
npm run typecheck
npm run build
```

The build writes `dist/gui-experimental.cjs`.

## Install / update

OpenCode Desktop loads GUI plugins from the server's `plugins` list. This plugin
is pinned in `~/.config/opencode/opencode.json`:

```json
{
  "plugins": ["opencode-prompt-rail@0.1.5"]
}
```

For a new version, bump `version` in `package.json`, build, pack, install the
tarball into the plugin cache, then update the pinned version in
`opencode.json`:

```sh
cd ~/.config/opencode/plugins/prompt-rail
npm run build
npm pack

SPEC="opencode-prompt-rail@0.1.5"
CACHE="$HOME/.cache/opencode/npm/$SPEC/$(python3 -c 'import time; print(int(time.time()*1000))')"
mkdir -p "$CACHE"
printf '{"dependencies":{"opencode-prompt-rail":"file:%s/opencode-prompt-rail-0.1.5.tgz"}}\n' "$PWD" > "$CACHE/package.json"
(cd "$CACHE" && npm install --no-audit --no-fund)
```

Then change the version in `opencode.json` and reload the OpenCode window
(**View > Reload**). The server config watcher reloads the server part; the
window reload loads the new GUI bundle.

## Notes

- The GUI part is a desktop feature. The browser web UI does not load GUI
  plugins, so the widgets appear in OpenCode Desktop only.
- The plugin never modifies the transcript. It reads user messages through the
  session data store and the message API.
