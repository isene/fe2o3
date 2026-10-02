#!/bin/bash
# install-check: prove that a clean machine ends up with a working Fe2O3.
#
# Run it as a normal user who can sudo, from a checkout of this repo, on a
# machine that has never seen Fe2O3. It installs the way the README says
# (the launcher, then the shell loop), and starts every program far enough
# to print its version or its help. The GitHub job in
# .github/workflows/install-test.yml runs it in clean containers.
set -uo pipefail

HERE=$(cd "$(dirname "$0")/.." && pwd)
BIN=$HOME/bin
fail=0
ok(){ printf '  ok    %s\n' "$1"; }
bad(){ printf '  FAIL  %s\n' "$1"; fail=1; }

# These print "<name> X.Y.Z" and leave. The rest of the README's list only
# knows --help, or needs a screen; for those the check is that the file
# loads (every library found).
VERSION="pointer kastrup scribe folio hush tock grid fleet hl2web beam yank astro moon stars
         exoplanets elements isotopes particles circuit fractal alchemy universe watchit tune
         amar melody typo gambit drain torii roam launch herald gaze"
HELP="scroll rpnx gazette library prism fonts"
# The rest are static and run anywhere. These are not: they need glibc 2.39
# or newer, so on an older system the check names them and moves on.
DYNAMIC="scroll tune gaze hush"
glibc=$(ldd --version 2>/dev/null | head -1 | grep -oE '[0-9]+\.[0-9]+$')
old=""
[ -n "$glibc" ] && [ "$(printf '%s\n2.39\n' "$glibc" | sort -V | head -1)" != 2.39 ] && old=yes

echo "== libraries three of the apps need"
# gaze is a GTK 4 and WebKit browser, hush speaks Opus, tune plays through PulseAudio.
if [ -n "$old" ]; then
    echo "  glibc $glibc: the apps that are not static are left out ($DYNAMIC)"
elif command -v apt-get >/dev/null; then
    sudo apt-get install -y libwebkitgtk-6.0-4 libgtk-4-1 libopus0 libpulse0 >/dev/null || bad "apt could not install the libraries"
elif command -v pacman >/dev/null; then
    sudo pacman -S --noconfirm --needed webkitgtk-6.0 gtk4 opus libpulse >/dev/null || bad "pacman could not install the libraries"
fi

echo "== install"
mkdir -p "$BIN"
export PATH=$BIN:$PATH
get(){ curl -fsSL --retry 2 "https://github.com/isene/$1/releases/latest/download/$1-linux-x86_64" -o "$BIN/$1" && chmod +x "$BIN/$1"; }
get fe2o3 || { echo "could not fetch the launcher"; exit 1; }
# The app list is the README's own loop, so the test follows the README.
apps=$(sed -n 's/^for app in \(.*\); do$/\1/p' "$HERE/README.md" | head -1)
[ -n "$apps" ] || { echo "no 'for app in ...' loop found in README.md"; exit 1; }
for app in $apps; do get "$app" || bad "$app: download failed"; done

echo "== programs start"
case $(fe2o3 --version 2>&1) in "fe2o3 "*) ok "fe2o3 --version" ;; *) bad "fe2o3 --version" ;; esac
for app in $apps; do
    [ -x "$BIN/$app" ] || continue
    if [ -n "$old" ]; then case " $DYNAMIC " in *" $app "*) ok "$app left out: needs glibc 2.39"; continue ;; esac; fi
    missing=$(ldd "$BIN/$app" 2>&1 | grep 'not found' | tr -s ' \t\n' ' ')
    if [ -n "$missing" ]; then bad "$app misses a library: $missing"; continue; fi
    case " $(echo $VERSION) " in *" $app "*)
        out=$(timeout 10 "$app" --version </dev/null 2>&1)
        case $out in "$app "*) ok "$app --version" ;; *) bad "$app --version said '${out:-nothing}'" ;; esac
        continue ;;
    esac
    case " $HELP " in *" $app "*)
        if timeout 10 "$app" --help </dev/null >/dev/null 2>&1; then ok "$app --help"; else bad "$app --help"; fi
        continue ;;
    esac
    ok "$app loads"
done

echo
if [ $fail = 0 ]; then echo "install-check: all good"; else echo "install-check: FAILED"; fi
exit $fail
