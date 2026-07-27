//! fe2o3 — the suite as a card grid.
//!
//! Every app in the family as a card with its logo, what it is, and one
//! line on why. Walk with the arrow keys, Enter runs it in this terminal,
//! `?` shows its own `--help`. Apps that are not installed stay on the
//! grid, dimmed; `i` fetches one, `I` fetches every missing one — so this
//! binary alone is enough to get the whole suite.
//!
//! The launcher itself does nothing while it waits: one blocking read on
//! stdin, no timers, no polling.

mod apps;

use apps::{App, APPS, LOGOS};
use crust::style;
use crust::{Crust, Cursor, Input, Pane, Popup};
use std::io::Write;
use std::path::PathBuf;

/// Each group gets a hue at two ends of the scale: a dark tint behind
/// its cards, a light one for its heading in `-l`. Same colour, so a
/// group is recognisable whichever way you look at the suite.
fn group_rgb(group: &str) -> ((u8, u8, u8), (u8, u8, u8)) {
    match group {
        "Daily drivers" => ((36, 21, 12), (255, 150, 90)),
        "Desk" => ((14, 22, 36), (120, 175, 255)),
        "Science" => ((11, 29, 29), (105, 225, 215)),
        "Media" => ((28, 16, 34), (200, 140, 255)),
        "Play" => ((14, 30, 19), (130, 220, 140)),
        "System" => ((32, 27, 12), (240, 205, 110)),
        _ => ((20, 20, 23), (150, 150, 158)), // Retired
    }
}

/// The legend chip: the same hue lifted a third of the way toward its
/// light end. A card tint is near-black on purpose — right behind a whole
/// card, unreadable as a twelve-character chip.
fn chip_rgb(group: &str) -> (u8, u8, u8) {
    let (dark, light) = group_rgb(group);
    let mix = |d: u8, l: u8| (d as u16 + (l as u16 - d as u16) * 38 / 100) as u8;
    (mix(dark.0, light.0), mix(dark.1, light.1), mix(dark.2, light.2))
}

/// The selected card lifts off its group tint.
fn lift(c: (u8, u8, u8)) -> (u8, u8, u8) {
    (
        c.0.saturating_add(24),
        c.1.saturating_add(20),
        c.2.saturating_add(16),
    )
}

const RUST_RGB: (u8, u8, u8) = (247, 76, 0);
const HEAD_RGB: (u8, u8, u8) = (247, 140, 60);
const DIM_RGB: (u8, u8, u8) = (110, 110, 120);
const BAR_BG: (u8, u8, u8) = (38, 38, 38);

/// Card geometry. The logo is a square block on the left, the words sit
/// to its right; three text rows is what a name, a kind and a hook need.
/// The width is worked out from the terminal so the grid fills it — a
/// fixed width leaves a ragged margin on wide screens and drops a column
/// on narrow ones.
const CARD_MIN_W: u16 = 34;
const CARD_H: u16 = 5;
const LOGO_W: u16 = 6;
const GRID_Y: u16 = 3;

struct Ui {
    sel: usize,
    /// Index of the first card on screen, so a long list pages instead of
    /// scrolling (paging redraws images once; scrolling would redraw them
    /// on every keypress).
    top: usize,
    filter: String,
    shown: Vec<usize>,
    installed: Vec<bool>,
    logos: PathBuf,
    images: Option<glow::Display>,
}

fn main() {
    for a in std::env::args().skip(1) {
        match a.as_str() {
            "-h" | "--help" => {
                println!("fe2o3 — the Fe2O3 suite as a card grid");
                println!();
                println!("Usage: fe2o3 [-l]");
                println!();
                println!("  -l     list the suite as plain text");
                println!("  -v     print version");
                println!();
                println!("In the grid: arrows move · Enter runs · i installs · I installs all missing");
                println!("             ? help · w repo · / filter · q quit");
                return;
            }
            "-v" | "--version" => {
                println!("fe2o3 {}", env!("CARGO_PKG_VERSION"));
                return;
            }
            "-l" | "--list" => {
                let color = std::io::IsTerminal::is_terminal(&std::io::stdout());
                let mut group = "";
                for app in APPS {
                    if app.group != group {
                        group = app.group;
                        if color {
                            let (_, light) = group_rgb(group);
                            println!("\n{}", style::rgb(group, Some(light), None, "b"));
                        } else {
                            println!("\n{group}");
                        }
                    }
                    println!("  {:<12} {:<28} {}", app.name, app.kind, app.blurb);
                }
                return;
            }
            // `fe2o3 tock` would just be a slower `tock` — the shell
            // already finds it on PATH — so there is no app argument.
            other => {
                eprintln!("fe2o3: unknown option '{other}' (try -h)");
                std::process::exit(1);
            }
        }
    }

    use std::io::IsTerminal;
    if !std::io::stdin().is_terminal() || !std::io::stdout().is_terminal() {
        for app in APPS {
            println!("{:<12} {:<28} {}", app.name, app.kind, app.blurb);
        }
        return;
    }

    let logos = unpack_logos();
    let installed: Vec<bool> = APPS.iter().map(|a| bin_path(a.bin).is_some()).collect();
    let mut ui = Ui {
        sel: 0,
        top: 0,
        filter: String::new(),
        shown: (0..APPS.len()).collect(),
        installed,
        logos,
        images: None,
    };

    Crust::init();
    Crust::set_app_identity("Fe2O3");
    ui.images = {
        let d = glow::Display::new();
        if d.supported() { Some(d) } else { None }
    };
    let (mut cols, mut rows) = Crust::terminal_size();
    let mut status = Pane::new(1, rows, cols, 1, 250, 236);
    status.scroll = false;

    draw_all(&mut ui, &mut status, cols, rows);

    loop {
        let Some(key) = Input::getchr(None) else { continue };
        match key.as_str() {
            "q" | "ESC" => break,
            "RIGHT" | "l" => step(&mut ui, 1, &mut status, cols, rows),
            "LEFT" | "h" => step(&mut ui, -1, &mut status, cols, rows),
            "DOWN" | "j" => {
                let c = per_row(cols) as i32;
                step(&mut ui, c, &mut status, cols, rows);
            }
            "UP" | "k" => {
                let c = per_row(cols) as i32;
                step(&mut ui, -c, &mut status, cols, rows);
            }
            "HOME" | "g" => {
                ui.sel = 0;
                draw_all(&mut ui, &mut status, cols, rows);
            }
            "END" | "G" => {
                ui.sel = ui.shown.len().saturating_sub(1);
                draw_all(&mut ui, &mut status, cols, rows);
            }
            "ENTER" | " " => {
                let Some(&i) = ui.shown.get(ui.sel) else { continue };
                if !ui.installed[i] {
                    status.say(&style::rgb(
                        &format!(" {} is not installed — press i to fetch it", APPS[i].name),
                        Some((255, 170, 80)),
                        None,
                        "",
                    ));
                    continue;
                }
                launch(&mut ui, i);
                let (c, r) = Crust::terminal_size();
                cols = c;
                rows = r;
                status.y = rows;
                status.w = cols;
                draw_all(&mut ui, &mut status, cols, rows);
            }
            "i" => {
                let Some(&i) = ui.shown.get(ui.sel) else { continue };
                fetch_one(&mut ui, i, &mut status);
                draw_cards(&mut ui, cols, rows, false);
                draw_header(&ui, cols);
            }
            "I" => {
                let missing: Vec<usize> = ui
                    .shown
                    .iter()
                    .copied()
                    .filter(|&i| !ui.installed[i])
                    .collect();
                if missing.is_empty() {
                    status.say(&style::dim(" everything on screen is already installed"));
                    continue;
                }
                let mut ok = 0;
                for i in &missing {
                    if fetch_one(&mut ui, *i, &mut status) {
                        ok += 1;
                    }
                }
                draw_all(&mut ui, &mut status, cols, rows);
                status.say(&style::rgb(
                    &format!(" installed {ok} of {}", missing.len()),
                    Some(if ok == missing.len() { (140, 220, 140) } else { (255, 170, 80) }),
                    None,
                    "",
                ));
            }
            "?" => {
                let Some(&i) = ui.shown.get(ui.sel) else { continue };
                show_help(&mut ui, i, cols, rows);
                draw_all(&mut ui, &mut status, cols, rows);
            }
            "w" => {
                let Some(&i) = ui.shown.get(ui.sel) else { continue };
                let url = format!("https://github.com/isene/{}", APPS[i].repo);
                let _ = std::process::Command::new("xdg-open")
                    .arg(&url)
                    .stdout(std::process::Stdio::null())
                    .stderr(std::process::Stdio::null())
                    .spawn();
                status.say(&style::dim(&format!(" {url}")));
            }
            "/" => {
                let q = status.ask_or_cancel("Filter: ", &ui.filter);
                print!("{}", Cursor::hide_seq());
                std::io::stdout().flush().ok();
                if let Some(q) = q {
                    ui.filter = q.trim().to_lowercase();
                    refilter(&mut ui);
                }
                draw_all(&mut ui, &mut status, cols, rows);
            }
            "RESIZE" => {
                let (c, r) = Crust::terminal_size();
                cols = c;
                rows = r;
                status.y = rows;
                status.w = cols;
                draw_all(&mut ui, &mut status, cols, rows);
            }
            _ => {}
        }
    }

    // On the way out, drop every placement rather than the ids we think
    // we own: a leftover logo painted over the shell outlives the process
    // that could have removed it.
    if let Some(d) = ui.images.as_mut() {
        d.clear_all();
    }
    Crust::cleanup();
}

// ─────────────────────────── the grid ────────────────────────────────

/// How many cards fit across, and how wide each one is.
fn grid(cols: u16) -> (usize, u16) {
    let n = ((cols / CARD_MIN_W).max(1)) as usize;
    (n, (cols / n as u16).max(24))
}

fn per_row(cols: u16) -> usize {
    grid(cols).0
}

fn per_page(cols: u16, rows: u16) -> usize {
    let card_rows = ((rows.saturating_sub(GRID_Y + 1)) / CARD_H).max(1) as usize;
    per_row(cols) * card_rows
}

fn step(ui: &mut Ui, delta: i32, status: &mut Pane, cols: u16, rows: u16) {
    if ui.shown.is_empty() {
        return;
    }
    let next = ui.sel as i32 + delta;
    if next < 0 || next as usize >= ui.shown.len() {
        return;
    }
    let old_page = ui.sel / per_page(cols, rows);
    ui.sel = next as usize;
    if ui.sel / per_page(cols, rows) != old_page {
        // New page: the images all move, so everything is redrawn.
        draw_all(ui, status, cols, rows);
    } else {
        // Same page: only two cards changed, so only their frames repaint.
        draw_cards(ui, cols, rows, false);
        status.say(&help_line(ui));
    }
}

fn refilter(ui: &mut Ui) {
    let f = ui.filter.clone();
    ui.shown = (0..APPS.len())
        .filter(|&i| {
            f.is_empty()
                || APPS[i].bin.contains(&f)
                || APPS[i].kind.to_lowercase().contains(&f)
                || APPS[i].blurb.to_lowercase().contains(&f)
                || APPS[i].group.to_lowercase().contains(&f)
        })
        .collect();
    ui.sel = 0;
    ui.top = 0;
}

fn draw_all(ui: &mut Ui, status: &mut Pane, cols: u16, rows: u16) {
    if let Some(d) = ui.images.as_mut() {
        d.clear(1, GRID_Y, cols, rows.saturating_sub(GRID_Y), cols, rows);
    }
    Crust::clear_screen();
    draw_header(ui, cols);
    draw_cards(ui, cols, rows, true);
    status.invalidate();
    status.say(&help_line(ui));
}

fn draw_header(ui: &Ui, cols: u16) {
    let n = ui.shown.len();
    let missing = ui.shown.iter().filter(|&&i| !ui.installed[i]).count();
    let mut info = format!(
        " {}  {}",
        style::rgb("fe2o3", Some(RUST_RGB), None, "b"),
        style::dim("the suite, one card at a time")
    );
    if !ui.filter.is_empty() {
        info.push_str(&format!("   {}", style::rgb(&format!("/{}", ui.filter), Some(HEAD_RGB), None, "b")));
    }
    let right = if missing > 0 {
        format!("{n} apps · {missing} not installed ")
    } else {
        format!("{n} apps ")
    };
    let pad = (cols as usize)
        .saturating_sub(crust::display_width(&info) + right.len());
    let armed = style::rgb("", None, Some(BAR_BG), "");
    let armed = armed.trim_end_matches(style::RESET);
    let line = info.replace(style::RESET, &format!("{}{}", style::RESET, armed));
    print!(
        "{}{}",
        Cursor::at(1, 1),
        style::rgb(
            &format!("{line}{}{}", " ".repeat(pad), style::dim(&right)),
            None,
            Some(BAR_BG),
            ""
        )
    );
    draw_legend(ui, cols);
    std::io::stdout().flush().ok();
}

/// Row 2: what each card tint means. The names carry the same light
/// colour their heading gets in `-l`, so the legend, the bands and the
/// text listing all agree. A group with nothing on screen (filtered
/// away) goes dim rather than disappearing, so the row never reflows.
fn draw_legend(ui: &Ui, cols: u16) {
    let mut seen: Vec<&str> = Vec::new();
    for app in APPS {
        if !seen.contains(&app.group) {
            seen.push(app.group);
        }
    }
    let present: Vec<&str> = ui
        .shown
        .iter()
        .map(|&i| APPS[i].group)
        .collect();
    // Each chip wears the tint its cards wear, so the legend is a sample
    // of the thing itself rather than a second colour to learn.
    let parts: Vec<String> = seen
        .iter()
        .map(|g| {
            let (fg, bg) = if present.contains(g) {
                ((240, 240, 245), chip_rgb(g))
            } else {
                ((120, 120, 128), group_rgb(g).0)
            };
            style::rgb(&format!(" {g} "), Some(fg), Some(bg), "")
        })
        .collect();
    let line = format!("  {}", parts.join(" "));
    print!("{}{}", Cursor::at(1, 2), crust::truncate_ansi(&line, cols as usize));
}

/// Draw the cards of the current page. `with_images` is false when only
/// the selection moved: the logos have not moved, and re-sending them
/// would make every keypress a graphics-protocol round trip.
fn draw_cards(ui: &mut Ui, cols: u16, rows: u16, with_images: bool) {
    let page = per_page(cols, rows);
    let (cols_n, card_w) = grid(cols);
    ui.top = (ui.sel / page) * page;
    let mut s = String::new();
    let mut group_drawn = "";

    for slot in 0..page {
        let Some(&app_i) = ui.shown.get(ui.top + slot) else { break };
        let app = &APPS[app_i];
        let x = 1 + (slot % cols_n) as u16 * card_w;
        let y = GRID_Y + (slot / cols_n) as u16 * CARD_H;
        let selected = ui.top + slot == ui.sel;
        let installed = ui.installed[app_i];
        s.push_str(&card(app, x, y, card_w, selected, installed));
        let _ = &mut group_drawn;
    }
    print!("{s}");
    std::io::stdout().flush().ok();

    if with_images {
        let paths: Vec<(String, u16, u16)> = (0..page)
            .filter_map(|slot| {
                let &app_i = ui.shown.get(ui.top + slot)?;
                let x = 1 + (slot % cols_n) as u16 * card_w;
                let y = GRID_Y + (slot / cols_n) as u16 * CARD_H;
                let p = ui.logos.join(format!("{}.png", APPS[app_i].name));
                p.exists().then(|| (p.display().to_string(), x + 1, y + 1))
            })
            .collect();
        if let Some(d) = ui.images.as_mut() {
            for (p, x, y) in paths {
                d.show(&p, x, y, LOGO_W - 1, CARD_H - 2);
            }
        }
    }
}

/// One card: frame, name, kind, hook. The logo is painted over the left
/// block afterwards by the image layer.
fn card(app: &App, x: u16, y: u16, card_w: u16, selected: bool, installed: bool) -> String {
    let w = (card_w - 2) as usize;
    let (tint, _) = group_rgb(app.group);
    let bg = if selected { lift(tint) } else { tint };
    let (frame, name_rgb) = if selected {
        (RUST_RGB, HEAD_RGB)
    } else if installed {
        ((70, 70, 80), (220, 220, 225))
    } else {
        ((45, 45, 52), DIM_RGB)
    };
    let text_rgb = if installed { (170, 170, 180) } else { DIM_RGB };
    let blurb_rgb = if installed { (135, 135, 145) } else { (85, 85, 92) };
    let tw = w - LOGO_W as usize; // room left of the logo block
    let mut s = String::new();
    // Every segment carries the tint itself: a nested reset would drop
    // the background half way along the row.
    let bar = |c: &str| style::rgb(c, Some(frame), Some(bg), "");

    s.push_str(&Cursor::at(x, y));
    s.push_str(&bar(&format!("┌{}┐", "─".repeat(w))));
    let lines = [
        style::rgb(&fit(app.name, tw), Some(name_rgb), Some(bg), if selected { "b" } else { "" }),
        style::rgb(&fit(app.kind, tw), Some(text_rgb), Some(bg), ""),
        style::rgb(&fit(app.blurb, tw), Some(blurb_rgb), Some(bg), ""),
    ];
    for (i, l) in lines.iter().enumerate() {
        s.push_str(&Cursor::at(x, y + 1 + i as u16));
        s.push_str(&format!(
            "{}{}{}{}",
            bar("│"),
            style::rgb(&" ".repeat(LOGO_W as usize), None, Some(bg), ""),
            l,
            bar("│")
        ));
    }
    s.push_str(&Cursor::at(x, y + CARD_H - 1));
    s.push_str(&bar(&format!("└{}┘", "─".repeat(w))));
    s
}

fn fit(s: &str, w: usize) -> String {
    let n = s.chars().count();
    if n <= w {
        format!("{s}{}", " ".repeat(w - n))
    } else {
        s.chars().take(w.saturating_sub(1)).collect::<String>() + "…"
    }
}

fn help_line(ui: &Ui) -> String {
    match ui.shown.get(ui.sel) {
        Some(&i) if !ui.installed[i] => style::dim(&format!(
            "←↓↑→ move · i installs {} · I installs all missing · ? help · w repo · q quit",
            APPS[i].name
        )),
        _ => style::dim(
            "←↓↑→ move · Enter runs it here · ? its help · w its repo · I installs missing · q quit",
        ),
    }
}

// ─────────────────────────── running one ─────────────────────────────

/// Hand the terminal over, run the app, take it back.
fn launch(ui: &mut Ui, i: usize) {
    let bin = bin_path(APPS[i].bin).unwrap_or_else(|| PathBuf::from(APPS[i].bin));
    if let Some(d) = ui.images.as_mut() {
        d.clear_all();
    }
    Crust::cleanup();
    let _ = std::process::Command::new(bin).status();
    Crust::init();
    Crust::set_app_identity("Fe2O3");
}

// ───────────────────────────── fetching ──────────────────────────────

/// Where a downloaded binary lands: `~/bin` if it exists, else
/// `~/.local/bin`. Nothing is created here — that is the installer's job,
/// so the lookup path stays a couple of `stat`s.
fn install_dir() -> PathBuf {
    let home = PathBuf::from(std::env::var("HOME").unwrap_or_else(|_| ".".into()));
    let bin = home.join("bin");
    if bin.is_dir() {
        bin
    } else {
        home.join(".local/bin")
    }
}

/// The release-asset suffix for this machine, matching the names the
/// per-app workflows publish.
fn asset_suffix() -> Option<&'static str> {
    Some(match (std::env::consts::OS, std::env::consts::ARCH) {
        ("linux", "x86_64") => "linux-x86_64",
        ("linux", "aarch64") => "linux-aarch64",
        ("macos", "x86_64") => "macos-x86_64",
        ("macos", "aarch64") => "macos-aarch64",
        _ => return None,
    })
}

/// Download one app's latest release binary. Returns where it landed.
///
/// A symlink is left alone on purpose: on a machine that builds the suite
/// from source, `~/bin/<tool>` points at that repo's `target/release`, and
/// replacing the link with a download would quietly unhook the build.
fn install(app: &App) -> Result<PathBuf, String> {
    let Some(suffix) = asset_suffix() else {
        return Err(format!(
            "no release build for {}/{} — build from source",
            std::env::consts::OS,
            std::env::consts::ARCH
        ));
    };
    let dir = install_dir();
    std::fs::create_dir_all(&dir).map_err(|e| format!("{}: {e}", dir.display()))?;
    let dest = dir.join(app.bin);
    if std::fs::symlink_metadata(&dest)
        .map(|m| m.file_type().is_symlink())
        .unwrap_or(false)
    {
        return Err(format!("{} is a symlink to a local build", dest.display()));
    }
    let url = format!(
        "https://github.com/isene/{}/releases/latest/download/{}-{}",
        app.repo, app.bin, suffix
    );
    let tmp = dir.join(format!(".{}.new", app.bin));
    let out = std::process::Command::new("curl")
        .args(["-fL", "-sS", "--retry", "2", "-o"])
        .arg(&tmp)
        .arg(&url)
        .output()
        .map_err(|e| format!("curl: {e}"))?;
    if !out.status.success() {
        let _ = std::fs::remove_file(&tmp);
        let why = String::from_utf8_lossy(&out.stderr).trim().to_string();
        return Err(if why.is_empty() { "download failed".into() } else { why });
    }
    use std::os::unix::fs::PermissionsExt;
    let _ = std::fs::set_permissions(&tmp, std::fs::Permissions::from_mode(0o755));
    std::fs::rename(&tmp, &dest).map_err(|e| e.to_string())?;
    Ok(dest)
}

/// Fetch one app and report it on the status line. Returns whether the
/// app is installed afterwards.
fn fetch_one(ui: &mut Ui, i: usize, status: &mut Pane) -> bool {
    let app = &APPS[i];
    if ui.installed[i] {
        status.say(&style::dim(&format!(" {} is already installed", app.name)));
        return true;
    }
    status.say(&style::dim(&format!(" fetching {} …", app.name)));
    match install(app) {
        Ok(p) => {
            ui.installed[i] = true;
            let warn = if on_path_dir(&p) {
                String::new()
            } else {
                format!("  (add {} to PATH)", p.parent().map(|d| d.display().to_string()).unwrap_or_default())
            };
            status.say(&style::rgb(
                &format!(" {} → {}{}", app.name, p.display(), warn),
                Some((140, 220, 140)),
                None,
                "",
            ));
            true
        }
        Err(e) => {
            status.say(&style::rgb(
                &format!(" {}: {e}", app.name),
                Some((255, 140, 120)),
                None,
                "",
            ));
            false
        }
    }
}

/// Is this file's directory one the shell will search?
fn on_path_dir(p: &std::path::Path) -> bool {
    let Some(dir) = p.parent() else { return false };
    std::env::var("PATH")
        .map(|path| path.split(':').any(|d| std::path::Path::new(d) == dir))
        .unwrap_or(false)
}


/// Ask an app what it is, without trusting it.
///
/// A third of the suite ignores `--help` and starts drawing instead, so
/// this runs with no stdin, gives it a second, and kills it if it is
/// still going. Whatever it printed comes back; the caller decides
/// whether it looks like help.
fn ask_help(bin: &std::path::Path) -> String {
    use std::process::{Command, Stdio};
    let Ok(mut child) = Command::new(bin)
        .arg("--help")
        .stdin(Stdio::null())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
    else {
        return String::new();
    };
    let deadline = std::time::Instant::now() + std::time::Duration::from_millis(1000);
    loop {
        match child.try_wait() {
            Ok(Some(_)) => break,
            Ok(None) if std::time::Instant::now() < deadline => {
                std::thread::sleep(std::time::Duration::from_millis(20));
            }
            _ => {
                // Still running: it is a TUI that took --help as "start".
                let _ = child.kill();
                let _ = child.wait();
                return String::new();
            }
        }
    }
    match child.wait_with_output() {
        Ok(o) if !o.stdout.is_empty() => String::from_utf8_lossy(&o.stdout).to_string(),
        Ok(o) => String::from_utf8_lossy(&o.stderr).to_string(),
        Err(_) => String::new(),
    }
}

/// The app's own `--help`, in a popup. Its help is always current; a
/// bundled copy of a README would start drifting the day it shipped.
fn show_help(ui: &mut Ui, i: usize, cols: u16, rows: u16) {
    let app = &APPS[i];
    let body = if ui.installed[i] {
        let bin = bin_path(app.bin).unwrap_or_else(|| PathBuf::from(app.bin));
        let text = ask_help(&bin);
        // Help text is plain. An escape sequence means the app ignored
        // --help and started drawing itself into the pipe, and a
        // complaint about the terminal means it refused outright — in
        // both cases show what the card knows instead.
        if text.trim().is_empty()
            || text.contains('\x1b')
            || text.contains("no terminal")
            || text.contains("not a terminal")
        {
            format!(
                "{}\n\nThis one does not answer --help over a pipe. Press Enter to run\nit, or w to open its README on GitHub.",
                app.blurb
            )
        } else {
            text
        }
    } else {
        format!(
            "{} is not installed.\n\nPress i to fetch the latest release into {}/,\n\
             or I to fetch every missing app at once.",
            app.name,
            install_dir().display()
        )
    };
    let text = format!(
        "{}  {}\n{}\n\n{}",
        style::rgb(app.name, Some(RUST_RGB), None, "b"),
        style::dim(app.kind),
        style::dim(&format!("github.com/isene/{}", app.repo)),
        body.trim_end()
    );
    if let Some(d) = ui.images.as_mut() {
        d.clear(1, GRID_Y, cols, rows.saturating_sub(GRID_Y), cols, rows);
    }
    let w = 84.min(cols.saturating_sub(6));
    let h = (rows.saturating_sub(8)).max(6);
    let mut pop = Popup::centered(w, h, 253, 234);
    pop.view(&text);
}

// ─────────────────────────── odds and ends ───────────────────────────

/// Write the embedded logos next to the config, once. The image
/// protocols all want a path, and a downloaded binary has no repo beside
/// it to read from.
fn unpack_logos() -> PathBuf {
    let home = std::env::var("HOME").unwrap_or_else(|_| ".".into());
    let dir = PathBuf::from(home).join(".fe2o3").join("logos");
    let _ = std::fs::create_dir_all(&dir);
    for (name, bytes) in LOGOS {
        let p = dir.join(format!("{name}.png"));
        // Rewrite only when it is missing or a different size: the common
        // case is a stat() and nothing else.
        let same = std::fs::metadata(&p).map(|m| m.len() as usize == bytes.len()).unwrap_or(false);
        if !same {
            let _ = std::fs::write(&p, bytes);
        }
    }
    dir
}

/// Where this binary is, if anywhere: PATH first, then the directory the
/// launcher installs into — a fetched app is usable right away even on a
/// machine whose `~/.local/bin` is not on PATH yet.
fn bin_path(bin: &str) -> Option<PathBuf> {
    let here = |dir: &std::path::Path| {
        let p = dir.join(bin);
        std::fs::metadata(&p).ok().filter(|m| m.is_file()).map(|_| p)
    };
    if let Ok(path) = std::env::var("PATH") {
        if let Some(p) = path.split(':').find_map(|d| here(std::path::Path::new(d))) {
            return Some(p);
        }
    }
    here(&install_dir())
}
