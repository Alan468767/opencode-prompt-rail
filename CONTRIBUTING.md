# Contributing

Thanks for taking the time to improve `opencode-prompt-rail`.

## Before you start

- Open an issue before a large change, so we can agree on the approach first.
- Bug reports are most useful with the OpenCode version, the plugin version, your
  OS, and what you expected to see.

## Local setup

```sh
git clone https://github.com/Alan468767/opencode-prompt-rail.git
cd opencode-prompt-rail
npm install
```

## While working

| Command | Purpose |
| --- | --- |
| `npm run typecheck` | Type-check without emitting |
| `npm run build` | Build `dist/gui-experimental.cjs` |
| `npm run dev` | Rebuild on every change |

To see your changes in a running desktop app, add the clone's path to the
`plugins` array of your **global** `~/.config/opencode/opencode.json`, then run
`npm run dev`. Every rebuild reloads the GUI in each window.

## Submitting a change

1. Keep the change focused; one pull request per concern.
2. Run `npm run typecheck` and `npm run build`.
3. Commit the rebuilt `dist/gui-experimental.cjs` together with your source
   change. CI fails when `dist/` does not match `src/`.
4. Update `CHANGELOG.md`.

## Code style

- TypeScript, strict mode, no `any` unless there is no alternative.
- SolidJS signals and memos, not derived state kept in plain variables.
- Keep module scope and `setup` light; they run in every desktop window.
- Any user-visible string goes through `ctx.t` with both `en` and `zh` entries.

## Preview images

`assets/rail.png` and `assets/rail-hover.png` are generated, not captured from a
real session. `docs/preview/index.html` reproduces the plugin's DOM and embeds
`src/gui.css`, inside a mock desktop frame with demo prompts, so the images never
contain anyone's data.

Regenerate them after a stylesheet or markup change:

```sh
node docs/preview/build.mjs      # set CHROME=… if Chrome is not in /Applications
```

## Reporting security issues

Please do not open a public issue for a vulnerability. See
[SECURITY.md](SECURITY.md).
