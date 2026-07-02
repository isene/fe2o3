# Fe₂O₃ — Rust Terminal Suite

<img src="docs/img/fe2o3.svg" align="left" width="150" height="150">

![Rust](https://img.shields.io/badge/language-Rust-f74c00) ![License](https://img.shields.io/badge/license-Unlicense-green) ![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS-blue) ![Stay Amazing](https://img.shields.io/badge/Stay-Amazing-important)

A suite of fast, opinionated terminal tools written in Rust. Single static binaries. Shared TUI foundation (crust). No runtime dependencies.

**Landing page:** [isene.github.io/fe2o3](https://isene.github.io/fe2o3/)

<br clear="left"/>

## The tools

### Binaries

| Tool | Release | Role | Ruby equivalent |
|---|---|---|---|
| [rush](https://github.com/isene/rush) | ![rush](https://badgen.net/github/release/isene/rush) | Interactive shell | [rsh](https://github.com/isene/rsh) |
| [pointer](https://github.com/isene/pointer) | ![pointer](https://badgen.net/github/release/isene/pointer) | File manager | [RTFM](https://github.com/isene/RTFM) |
| [kastrup](https://github.com/isene/kastrup) | ![kastrup](https://badgen.net/github/release/isene/kastrup) | Messaging hub (email, RSS, chat) | [Heathrow](https://github.com/isene/heathrow) |
| [scribe](https://github.com/isene/scribe) | ![scribe](https://badgen.net/github/release/isene/scribe) | Modal text editor for writers | — |
| [scroll](https://github.com/isene/scroll) | ![scroll](https://badgen.net/github/release/isene/scroll) | Web browser | [brrowser](https://github.com/isene/brrowser) |
| [gazette](https://github.com/isene/gazette) | ![gazette](https://badgen.net/github/release/isene/gazette) | Daily news digest reader | — |
| [tock](https://github.com/isene/tock) | ![tock](https://badgen.net/github/release/isene/tock) | Calendar with ephemeris | [Timely](https://github.com/isene/timely) |
| [astro](https://github.com/isene/astro) | ![astro](https://badgen.net/github/release/isene/astro) | Astronomy panel + telescope/eyepiece catalog | [astropanel](https://github.com/isene/astropanel) + [telescope-term](https://github.com/isene/telescope) |
| [watchit](https://github.com/isene/watchit) | ![watchit](https://badgen.net/github/release/isene/watchit) | Movie / series browser | [IMDB-terminal](https://github.com/isene/IMDB) |
| [torii](https://github.com/isene/torii) | ![torii](https://badgen.net/github/release/isene/torii) | Captive-portal listener (NetworkManager → Firefox) | — |
| [crush](https://github.com/isene/crush) | ![crush](https://badgen.net/github/release/isene/crush) | Configuration TUI for rush | — |
| [prism](https://github.com/isene/prism) | ![prism](https://badgen.net/github/release/isene/prism) | TUI color picker (FG/BG slots, RGB+HSV, WCAG contrast) | — |
| [fonts](https://github.com/isene/fonts) | ![fonts](https://badgen.net/github/release/isene/fonts) | TUI font picker with live previews (enumerates installed fonts via glyph); returns family + size | — |
| [drain](https://github.com/isene/drain) | ![drain](https://badgen.net/github/release/isene/drain) | Battery-drain triage TUI (top wakers, per-WS attribution) | — |
| [amar](https://github.com/isene/amar) | ![amar](https://badgen.net/github/release/isene/amar) | Amar RPG companion (NPC / encounter / town / weather forge, campaign tracker, lore, AI inspire) | [Amar-Tools](https://github.com/isene/Amar-Tools) |
| [tune](https://github.com/isene/tune) | ![tune](https://badgen.net/github/release/isene/tune) | Spotify Connect controller (search, library, queue, devices, transport) | — |
| [melody](https://github.com/isene/melody) | ![melody](https://badgen.net/github/release/isene/melody) | Melody maker — piano-roll play / record / edit, metronome, WAV export | — |
| [petri](https://github.com/isene/petri) | ![petri](https://badgen.net/github/release/isene/petri) | Petri net player — load a net, fire transitions, watch conflicts, find deadlocks | — |
| [petri](https://github.com/isene/petri) | ![petri](https://badgen.net/github/release/isene/petri) | Petri net player — fire transitions, watch conflicts, find deadlocks | — |
| [library](https://github.com/isene/library) | ![library](https://badgen.net/github/release/isene/library) | Generative personal library (curate a shelf of books that should exist, then have them written on demand) | — |
| [grid](https://github.com/isene/grid) | ![grid](https://badgen.net/github/release/isene/grid) | AI-native spreadsheet (csv/xlsx/ods, formula engine, Claude editing) | — |
| [viewer](https://github.com/isene/viewer) | ![viewer](https://badgen.net/github/release/isene/viewer) | Universal file viewer (tables, docs, slides, pdf, images, code; launches the right editor) | — |

> [nova](https://github.com/isene/nova) and [scope](https://github.com/isene/scope) have been merged into **astro** and are archived. [hyper](https://github.com/isene/hyper) has been folded into **scribe** — `.hl` editing now lives there with full hyperlist.vim parity. All three READMEs link to their replacements.

### Libraries

| Crate | Release | Role | Ruby equivalent |
|---|---|---|---|
| [crust](https://github.com/isene/crust) | ![crust](https://badgen.net/github/release/isene/crust) | TUI foundation (panes, colors, input) | [rcurses](https://github.com/isene/rcurses) |
| [glow](https://github.com/isene/glow) | ![glow](https://badgen.net/github/release/isene/glow) | Inline images (kitty / sixel / w3m / braille) | [termpix](https://github.com/isene/termpix) |
| [highlight](https://github.com/isene/highlight) | ![highlight](https://badgen.net/github/release/isene/highlight) | Theme-aware syntax highlighter (~18 source langs + HL / Markdown / LaTeX / email) | — |
| [orbit](https://github.com/isene/orbit) | ![orbit](https://badgen.net/github/release/isene/orbit) | Moon phases, ephemeris, sun / planet positions | [ephemeris](https://github.com/isene/ephemeris) |
| [plot](https://github.com/isene/plot) | ![plot](https://badgen.net/github/release/isene/plot) | Terminal charts (sparkline / line / candle / bar) with Unicode + ANSI | [termchart](https://github.com/isene/termchart) |

## Companion apps — [nomad](https://github.com/isene/nomad)

The mobile half of the family. **[nomad](https://github.com/isene/nomad)** is a
single Android monorepo — a shared **Rust core** (the same logic as the
desktop, via [UniFFI](https://mozilla.github.io/uniffi-rs/)) under thin
**Kotlin / Compose** shells. Each app carries one Fe₂O₃ workflow off the laptop
and syncs its data over [Syncthing](https://syncthing.net) — no Google account,
no cloud middleman.

| App | Pairs with | Role |
|---|---|---|
| **tasks** | [scribe](https://github.com/isene/scribe), [kastrup](https://github.com/isene/kastrup) | HyperList todo editor + Glance widget for `~/.tasks/todo.hl` |
| **hyperlist** | [scribe](https://github.com/isene/scribe) | General HyperList editor with full syntax highlighting |
| **relay** | [kastrup](https://github.com/isene/kastrup) | Notification gateway (WhatsApp / Messenger / IG / SMS / Discord → kastrup) — replaces the laptop Marionette bridge |
| **astro** | [astro](https://github.com/isene/astro) | Ephemeris, weather + observing conditions, events, APOD, gear catalog |
| **watchit** | [watchit](https://github.com/isene/watchit) | TMDB movie / series browser with wish/dump lists |
| **amardice** | [amar](https://github.com/isene/amar) | Amar RPG O6 dice roller (skill / combat / fear) |
| **xrpn** | [xrpn](https://github.com/isene/xrpn) | Pocket HP-41 RPN calculator + FOCAL program runner |
| **scribe** | [scribe](https://github.com/isene/scribe) | Distraction-free notes pad — touch companion to the scribe editor |
| **ref** | — | Offline, searchable reference reader (glossaries, books, personal writings) |
| **vox** | — | Voice quick-capture — pocket version of the laptop `Win+a` voice-to-text |
| **gazette** | [gazette](https://github.com/isene/gazette) | Daily news digest reader — browse the last 7 issues (and PDF) synced into `~/.news` |
| **books** | [library](https://github.com/isene/library) | The library on your phone, read-only: only the books you have made, grouped by shelf, with inline figures |
| **onepage** | — | Minimal Android home launcher (one screen, freely-placed widgets, zero idle cost) |

## Install everything

```bash
# Linux x86_64 — one-liner to grab every Fe₂O₃ binary
for app in rush pointer kastrup scribe scroll gazette tock astro watchit torii crush prism fonts drain amar tune melody petri library grid viewer; do
  curl -L "https://github.com/isene/$app/releases/latest/download/$app-linux-x86_64" \
    -o ~/bin/$app && chmod +x ~/bin/$app
done

# Other platforms: replace -linux-x86_64 with:
#   -linux-aarch64   (Raspberry Pi, ARM64 Linux)
#   -macos-x86_64    (Intel Mac)
#   -macos-aarch64   (Apple Silicon)
```

## Why "Fe₂O₃"?

Rust the language was actually named after a family of fungi (Pucciniales, plant pathogens "over-engineered for survival" per Graydon Hoare). The iron-oxide association came later, through the visual rhyme with what those fungi look like on a leaf. Fe₂O₃ is that iron oxide: what happens when iron meets oxygen meets time. This is the terminal-facing half of that toolkit.

Every tool is a feature port of a long-running Ruby original, rewritten for speed, single-binary distribution, and async-first UI behavior.

## License

All tools in the suite are public domain (Unlicense). Borrow or steal whatever you want.

— [Geir Isene](https://isene.com)
