#!/usr/bin/env node
// Regenerates the preview images in assets/ from docs/preview/index.html.
//
// The page embeds the plugin's real stylesheet, so a stylesheet change shows up
// in the next capture. Requires a Chromium-based browser; set CHROME to its
// executable if it is not in the default macOS location.
//
//   node docs/preview/build.mjs

import { execFileSync } from "node:child_process"
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, "..", "..")
const chrome =
  process.env.CHROME ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

const css = readFileSync(join(root, "src", "gui.css"), "utf8").trim()
const template = readFileSync(join(here, "index.html"), "utf8")

if (!template.includes("/*__GUI_CSS__*/")) {
  throw new Error("docs/preview/index.html is missing its /*__GUI_CSS__*/ placeholder")
}

const work = join(here, ".render")
mkdirSync(work, { recursive: true })
const page = join(work, "index.html")
writeFileSync(page, template.replace("/*__GUI_CSS__*/", css))

mkdirSync(join(root, "assets"), { recursive: true })

// Full window at rest, then a zoomed capture with the preview card open on the
// seventh line.
const shots = [
  { file: "rail.png", query: "" },
  { file: "rail-hover.png", query: "?hover=6&zoom=2.9&focus=500,440" },
]

for (const shot of shots) {
  const out = join(root, "assets", shot.file)
  execFileSync(
    chrome,
    [
      "--headless=new",
      "--hide-scrollbars",
      "--disable-gpu",
      "--no-first-run",
      "--no-default-browser-check",
      `--user-data-dir=${join(work, "profile")}`,
      "--force-device-scale-factor=2",
      "--window-size=1440,900",
      `--screenshot=${out}`,
      `file://${page}${shot.query}`,
    ],
    { stdio: ["ignore", "ignore", "inherit"] },
  )
  console.log(`wrote ${out}`)
}
