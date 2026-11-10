# Changelog

All notable changes to this project are documented here. This project follows
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## 0.1.10

### Changed

- The README now leads with `opencode plugin add opencode-prompt-rail`. The
  package is published, so the install no longer needs a repository clone, and the
  earlier "not on npm yet" note is gone.
- Installing from the repository is documented as the fallback, since npm's git
  preparation fails on some builds.

## 0.1.9

### Changed

- Removed the `prepack` build. `dist/` is committed and CI verifies it, and a
  pack-time build made repository installs depend on devDependencies.
- The README now documents the clone-and-path install first. Installing straight
  from a repository goes through npm's git preparation, which fails with
  `git dep preparation failed` on some OpenCode builds.

## 0.1.8

### Fixed

- The package now exports its server part as `./server` as well as `.`. The plugin
  installer only recognises `./server`, `./tui`, a `main` entry, or `oc-themes`, so
  it rejected the package with "does not expose plugin entrypoints".
- The README install steps no longer use `opencode plugin add <name> --global` as
  the only path. Older builds have no `add` subcommand, and the package is not on
  npm yet.

## 0.1.7

First public release.

### Added

- A `limit` plugin option to set how many prompts the rail keeps (default `10`,
  range `1`–`50`).
- Keyboard access for the rail: each line is focusable, opens its preview on
  focus, and copies on `Enter` or `Space`.
- A visible focus ring on rail lines.

### Fixed

- The rail briefly showed the previous session's prompts after switching
  sessions, until the new history request resolved.
- A failed history request was silently ignored; it now logs a warning.

### Changed

- The package is published under the MIT license.
- `package.json` gained repository, homepage, issue tracker, keywords, and Node
  engine metadata, plus a `prepack` build so a packed tarball cannot ship a stale
  bundle.
- `package-lock.json` is committed for reproducible installs.
- The README documents the supported install paths for users who are not the
  author.
