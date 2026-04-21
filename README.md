# Fe₂O₃ — Rust Terminal Suite

<img src="docs/img/fe2o3.svg" align="left" width="150" height="150">

![Rust](https://img.shields.io/badge/language-Rust-f74c00) ![License](https://img.shields.io/badge/license-Unlicense-green) ![Platform](https://img.shields.io/badge/platform-Linux%20%7C%20macOS-blue) ![Stay Amazing](https://img.shields.io/badge/Stay-Amazing-important)

A suite of fast, opinionated terminal tools written in Rust. Single static binaries. Shared TUI foundation (crust). No runtime dependencies.

**Landing page:** [isene.github.io/fe2o3](https://isene.github.io/fe2o3/)

<br clear="left"/>

## The tools

### Binaries

| Tool | Role | Ruby equivalent | Release |
|---|---|---|---|
| [rush](https://github.com/isene/rush) | Interactive shell | [rsh](https://github.com/isene/rsh) | ![rush](https://img.shields.io/github/v/release/isene/rush) |
| [pointer](https://github.com/isene/pointer) | File manager | [RTFM](https://github.com/isene/RTFM) | ![pointer](https://img.shields.io/github/v/release/isene/pointer) |
| [kastrup](https://github.com/isene/kastrup) | Messaging hub (email, RSS, chat) | [Heathrow](https://github.com/isene/heathrow) | ![kastrup](https://img.shields.io/github/v/release/isene/kastrup) |
| [scroll](https://github.com/isene/scroll) | Web browser | [brrowser](https://github.com/isene/brrowser) | ![scroll](https://img.shields.io/github/v/release/isene/scroll) |
| [tock](https://github.com/isene/tock) | Calendar with ephemeris | [Timely](https://github.com/isene/timely) | ![tock](https://img.shields.io/github/v/release/isene/tock) |
| [nova](https://github.com/isene/nova) | Astronomy panel | [astropanel](https://github.com/isene/astropanel) | ![nova](https://img.shields.io/github/v/release/isene/nova) |
| [watchit](https://github.com/isene/watchit) | Movie / series browser | [IMDB-terminal](https://github.com/isene/IMDB) | ![watchit](https://img.shields.io/github/v/release/isene/watchit) |

### Libraries

| Crate | Role | Ruby equivalent | Release |
|---|---|---|---|
| [crust](https://github.com/isene/crust) | TUI foundation (panes, colors, input) | [rcurses](https://github.com/isene/rcurses) | ![crust](https://img.shields.io/github/v/release/isene/crust) |
| [glow](https://github.com/isene/glow) | Inline images (kitty / sixel / w3m) | [termpix](https://github.com/isene/termpix) | ![glow](https://img.shields.io/github/v/release/isene/glow) |

## Install everything

```bash
# Linux x86_64 — one-liner to grab every Fe₂O₃ binary
for app in rush pointer kastrup scroll tock nova watchit; do
  curl -L "https://github.com/isene/$app/releases/latest/download/$app-linux-x86_64" \
    -o ~/bin/$app && chmod +x ~/bin/$app
done

# Other platforms: replace -linux-x86_64 with:
#   -linux-aarch64   (Raspberry Pi, ARM64 Linux)
#   -macos-x86_64    (Intel Mac)
#   -macos-aarch64   (Apple Silicon)
```

## Why "Fe₂O₃"?

Rust the language took its name from rust the chemical. Fe₂O₃ is the iron oxide that gives rust its color, and what happens when iron meets oxygen meets time. This is the terminal-facing half of that toolkit.

Every tool is a feature port of a long-running Ruby original, rewritten for speed, single-binary distribution, and async-first UI behavior.

## License

All tools in the suite are public domain (Unlicense). Borrow or steal whatever you want.

— [Geir Isene](https://isene.com)
