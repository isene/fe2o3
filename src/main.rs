//! fe2o3 — the suite as a card grid.
//!
//! Every app in the family as a card with its logo, what it is, and one
//! line on why. Walk with the arrow keys, Enter runs it in this terminal,
//! `?` shows its own `--help`. Apps that are not installed stay on the
//! grid, dimmed, with the command to fetch them.
//!
//! The launcher itself does nothing while it waits: one blocking read on
//! stdin, no timers, no polling.

mod apps;

use apps::{App, APPS, LOGOS};
use crust::style;
use crust::{Crust, Cursor, Input, Pane, Popup};
use std::io::Write;
use std::path::PathBuf;

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
                println!("In the grid: arrows move · Enter runs · ? help · w repo · / filter · q quit");
                return;
            }
            "-v" | "--version" => {
                println!("fe2o3 {}", env!("CARGO_PKG_VERSION"));
                return;
            }
            "-l" | "--list" => {
                let mut group = "";
                for app in APPS {
                    if app.group != group {
                        group = app.group;
                        println!("\n{group}");
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
    let installed: Vec<bool> = APPS.iter().map(|a| on_path(a.bin)).collect();
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
                        &format!(
                            " {} is not installed — press w for github.com/isene/{}",
                            APPS[i].name, APPS[i].repo
                        ),
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

    if let Some(d) = ui.images.as_mut() {
        d.clear(1, GRID_Y, cols, rows.saturating_sub(GRID_Y), cols, rows);
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
    std::io::stdout().flush().ok();
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
    let (frame, name_rgb) = if selected {
        (RUST_RGB, HEAD_RGB)
    } else if installed {
        ((70, 70, 80), (220, 220, 225))
    } else {
        ((45, 45, 52), DIM_RGB)
    };
    let text_rgb = if installed { (170, 170, 180) } else { DIM_RGB };
    let tw = w - LOGO_W as usize; // room left of the logo block
    let mut s = String::new();
    let bar = |c: &str| style::rgb(c, Some(frame), None, "");

    s.push_str(&Cursor::at(x, y));
    s.push_str(&bar(&format!("┌{}┐", "─".repeat(w))));
    let lines = [
        style::rgb(&fit(app.name, tw), Some(name_rgb), None, if selected { "b" } else { "" }),
        style::rgb(&fit(app.kind, tw), Some(text_rgb), None, ""),
        style::dim(&fit(app.blurb, tw)),
    ];
    for (i, l) in lines.iter().enumerate() {
        s.push_str(&Cursor::at(x, y + 1 + i as u16));
        s.push_str(&format!(
            "{}{}{}{}",
            bar("│"),
            " ".repeat(LOGO_W as usize),
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
            "←↓↑→ move · not installed: w opens github.com/isene/{} · ? help · / filter · q quit",
            APPS[i].repo
        )),
        _ => style::dim(
            "←↓↑→ move · Enter runs it here · ? its help · w its repo · / filter · q quit",
        ),
    }
}

// ─────────────────────────── running one ─────────────────────────────

/// Hand the terminal over, run the app, take it back.
fn launch(ui: &mut Ui, i: usize) {
    if let Some(d) = ui.images.as_mut() {
        let (c, r) = Crust::terminal_size();
        d.clear(1, GRID_Y, c, r.saturating_sub(GRID_Y), c, r);
    }
    Crust::cleanup();
    let _ = std::process::Command::new(APPS[i].bin).status();
    Crust::init();
    Crust::set_app_identity("Fe2O3");
}

/// The app's own `--help`, in a popup. Its help is always current; a
/// bundled copy of a README would start drifting the day it shipped.
fn show_help(ui: &mut Ui, i: usize, cols: u16, rows: u16) {
    let app = &APPS[i];
    let body = if ui.installed[i] {
        let out = std::process::Command::new(app.bin).arg("--help").output();
        let text = match out {
            Ok(o) if !o.stdout.is_empty() => String::from_utf8_lossy(&o.stdout).to_string(),
            Ok(o) if !o.stderr.is_empty() => String::from_utf8_lossy(&o.stderr).to_string(),
            _ => String::new(),
        };
        // An app that refuses to answer over a pipe has nothing to say
        // here; fall back to what the card knows rather than showing its
        // complaint about not having a terminal.
        if text.trim().is_empty() || text.contains("no terminal") || text.contains("not a terminal") {
            format!(
                "{}\n\nIt has no --help to show over a pipe. Press Enter to run it,\nor w to open its README on GitHub.",
                app.blurb
            )
        } else {
            text
        }
    } else {
        format!(
            "{} is not installed.\n\n\
             curl -L https://github.com/isene/{}/releases/latest/download/{}-linux-x86_64 \\\n  \
             -o ~/bin/{} && chmod +x ~/bin/{}",
            app.name, app.repo, app.bin, app.bin, app.bin
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

/// Is this binary somewhere on PATH?
fn on_path(bin: &str) -> bool {
    let Ok(path) = std::env::var("PATH") else { return false };
    path.split(':').any(|dir| {
        let p = std::path::Path::new(dir).join(bin);
        std::fs::metadata(&p).map(|m| m.is_file()).unwrap_or(false)
    })
}
