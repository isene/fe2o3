# Fe₂O₃ — Rust Terminal Suite (umbrella)

This repo is the **landing page and suite-level docs** for the Fe₂O₃
family of Rust terminal tools. There is no Rust code here — the actual
code lives in sibling repos (one per binary, plus shared libraries).

Public landing page: <https://isene.github.io/fe2o3/>

## Suite members

### Apps (one repo per binary)
| Tool | Repo | Role |
|---|---|---|
| rush    | <https://github.com/isene/rush>    | Interactive shell |
| pointer | <https://github.com/isene/pointer> | File manager |
| kastrup | <https://github.com/isene/kastrup> | Messaging hub (email, RSS, chat) |
| scribe  | <https://github.com/isene/scribe>  | Modal text editor for writers |
| scroll  | <https://github.com/isene/scroll>  | Terminal web browser |
| gazette | <https://github.com/isene/gazette> | Daily news digest reader (server-side Claude → ~/.news → TUI) |
| tock    | <https://github.com/isene/tock>    | Calendar with ephemeris |
| astro   | <https://github.com/isene/astro>   | Astronomy panel + telescope/eyepiece catalog |
| watchit | <https://github.com/isene/watchit> | Movie / series browser |
| torii   | <https://github.com/isene/torii>   | Captive-portal listener (NetworkManager → Firefox) |
| crush   | <https://github.com/isene/crush>   | Configuration TUI for rush |
| prism   | <https://github.com/isene/prism>   | TUI color picker (FG/BG slots, RGB+HSV, WCAG contrast) |
| fonts   | <https://github.com/isene/fonts>   | TUI font picker with live previews (via glyph); returns family + size — used by scribe `\F` |
| amar    | <https://github.com/isene/amar>    | Amar RPG companion (5-tab TUI: Inspire, Forge, Campaign, Session, Lore — honors d6gaming.org canon) |
| tune    | <https://github.com/isene/tune>    | Spotify Connect controller (search, library, queue, devices, transport) |
| library | <https://github.com/isene/library> | Generative personal library (curate a shelf of books that should exist, then have them written; pairs with nomad `books`) |
| rpnx    | <https://github.com/isene/rpnx>    | RPN / XRPN scientific calculator (HP-41 stack, cycling shift pages, runs XRPN programs; shares fe2o3-rpnx-core with the nomad rpnx app; scribe `=` inserts its result) |
| elements | <https://github.com/isene/elements> | Periodic table explorer (118 + hypothesized 119–126, full Wikipedia article per element, cached at ~/.elements/) |
| stars   | <https://github.com/isene/stars>   | Hertzsprung-Russell diagram explorer (461 named stars from HYG + Wikidata, schematic evolutionary tracks, article per star, cached at ~/.stars/) |
| particles | <https://github.com/isene/particles> | Standard Model explorer (17 fundamental particles + proton/neutron with PDG values, and a braille 3D zoom atom → nucleus → nucleon → quark) |

### Archived (don't modify)
| Tool | Repo | Replaced by |
|---|---|---|
| nova  | <https://github.com/isene/nova>  | astro (Sky mode) |
| scope | <https://github.com/isene/scope> | astro (Gear mode) |
| hyper | <https://github.com/isene/hyper> | scribe (full hyperlist.vim parity since v0.1.28) |

### Shared libraries
| Crate (crates.io) | Lib name (`use`) | Repo | Role |
|---|---|---|---|
| `fe2o3-crust` | `crust` | <https://github.com/isene/crust> | TUI panes, ANSI, scroll regions, editline |
| `fe2o3-glow`  | `glow`  | <https://github.com/isene/glow>  | Inline images (kitty / sixel / w3m / chafa / braille) |
| `fe2o3-orbit` | `orbit` | <https://github.com/isene/orbit> | Moon phases, ephemeris, sun/planet positions |
| `fe2o3-highlight` | `highlight` | <https://github.com/isene/highlight> | Theme-aware syntax highlighter (~18 langs + HL/MD/LaTeX/email) |
| `fe2o3-starmap` | `starmap` | <https://github.com/isene/starmap> | The naked-eye sky in braille: 9,096 stars (Yale BSC + Hipparcos distances), constellation figures, horizon + hemisphere projections, interactive star picker |
| `plot` | `plot` | <https://github.com/isene/plot> | Terminal charts (sparkline / line / candle / bar) |
| `fe2o3-rpnx-core` | `rpnx_core` | <https://github.com/isene/rpnx-core> | RPN / XRPN calculator engine (shared by rpnx TUI + RPNx phone app; optional `uniffi` feature) |

Local clones live under `/home/geir/Main/G/GIT-isene/<name>/`.

## Design goal hierarchy (binding for every member project)

In strict priority order:

1. **No wasted CPU cycles.** Gate every feature so its code path is fully
   cold when not in use. Compare target state to last-applied state before
   doing X11 / file / syscall work. Don't fire-and-forget work whose result
   is identical to what's already on screen / disk.
2. **Lightning fast.** Microsecond startup, instantaneous user feedback.
   No interpreters in the hot path. Cache anything that doesn't change
   between invocations. Single-digit-ms is fine; double-digit-ms wants
   justification.
3. **More battery life.** Polling, waking, or spawning subprocesses on a
   timer is suspect. Prefer filesystem watches / sysfs reads to forks;
   prefer `stat()` to `fork()`.

When in doubt: measure. `time` the command, check syscall count with
`strace -c`, profile if it's tight.

## Where the deep knowledge lives

The `fe2o3` Claude skill (`~/.claude/skills/fe2o3/SKILL.md`) carries the
hard-won lessons that matter when working in this codebase:

- Kitty graphics protocol traps (image data freed when last placement is
  deleted, cell-aligned padding to avoid stretching, `z=1` vs text overdraw)
- UTF-8 byte vs char boundary correctness (editline cursor,
  `decode_quoted_printable`)
- `regex` crate has NO backreferences
- MIME multipart cascade and HTML rendering pipeline (kastrup)
- OSC 8 hyperlink state across `wrap_lines` / `truncate_ansi` (crust)
- Per-app quirks (rush startup perf, pointer reload-and-render,
  kastrup `get_display_content`, scroll DEC-region image handling, etc.)

The skill is auto-suggested when working on any Fe2O3 project (file path
patterns + keyword triggers in `~/.claude/skills/skill-rules.json`).

## No hand-rolled ANSI

Every escape sequence in the suite comes from **crust** (`style::*`,
`Cursor::*`, `seq::*`, `Crust::*`). `glow` is the only exception, for
the kitty graphics protocol. If crust can't express what you need, add
it to crust, bump, ship, then use it. Raw literals are acceptable only
for byte-level input matching and parsers that skip over SGR runs.

See the tree-wide `../CLAUDE.md` for the full helper map.

## Build pattern (every project)

```bash
PATH="/usr/bin:$PATH" cargo build --release
```

The `PATH` prefix avoids `~/bin/cc` (the Claude Code session launcher)
shadowing the C compiler that Rust's build scripts call out to.

## Symlinks, not hardlinks

`~/bin/<tool>` is a **symlink** to `<repo>/target/release/<tool>`. Never
a hardlink (the user's setup uses symlinks everywhere). After
`cargo build --release`, `~/bin/<tool>` is automatically up-to-date.
Verify with `readlink -f`.

## Crates.io publishing convention

The libraries publish under prefixed crate names but expose the short
import name via `[lib]`:

```toml
[package]
name = "fe2o3-crust"   # crates.io
[lib]
name = "crust"          # use crust::...
```

App `Cargo.toml` files reference them via local-path AND the published
package name:

```toml
[dependencies]
crust = { version = "0.1", path = "../crust", package = "fe2o3-crust" }
glow  = { version = "0.1", path = "../glow",  package = "fe2o3-glow" }
```

When publishing a new lib version, dependent app `Cargo.lock` files need
a refresh build to pick it up.

## Release flow

Most apps have a `release.yml` workflow that auto-builds and publishes a
GitHub release on tag push. Don't manually `gh release create` for those
apps — it'll race with the workflow.

```bash
# Bump version in Cargo.toml
PATH="/usr/bin:$PATH" cargo build --release
git add Cargo.toml Cargo.lock src/...
git commit -m "Subject (vX.Y.Z)"
git tag vX.Y.Z
git push origin master
git push origin vX.Y.Z
```

Apps without `release.yml` (currently: glow, crust): tag + push, then
manual `gh release create` only if a binary asset is needed.

## Editing this repo

- README.md is the public landing page (rendered at the GitHub Pages URL
  above). Keep it user-facing and free of Claude-specific notes.
- `docs/` holds suite-level documentation, images, and the GitHub Pages
  source.
- Per-project notes belong in the **member project's** `CLAUDE.md`, not
  here.
