//! The suite's own catalog: one row per app.
//!
//! Adding an app is one line here plus its logo in `img/logos/<bin>.png`.
//! Nothing else in the launcher needs to know about it.

pub struct App {
    /// What it is called — also the logo's file name.
    pub name: &'static str,
    /// The binary to run and to look for on PATH. Usually the same as
    /// `name`; CC-sessions ships as `cc`.
    pub bin: &'static str,
    /// The GitHub repo under github.com/isene, for `w`.
    pub repo: &'static str,
    /// What kind of tool it is, one short phrase.
    pub kind: &'static str,
    /// The hook, one line.
    pub blurb: &'static str,
    /// Section heading it sits under.
    pub group: &'static str,
}

pub const APPS: &[App] = &[
    App { name: "pointer", bin: "pointer", repo: "pointer", kind: "File Manager", blurb: "Two-pane file manager with syntax-highlighted…", group: "Daily drivers" },
    App { name: "kastrup", bin: "kastrup", repo: "kastrup", kind: "Messaging Hub", blurb: "Unified terminal inbox for maildir email, RSS,…", group: "Daily drivers" },
    App { name: "scribe", bin: "scribe", repo: "scribe", kind: "Modal Text Editor", blurb: "Vim-flavoured modal editor for writers", group: "Daily drivers" },
    App { name: "scroll", bin: "scroll", repo: "scroll", kind: "Web Browser", blurb: "Terminal web browser with vim-style keys, tabs,…", group: "Daily drivers" },
    App { name: "tock", bin: "tock", repo: "tock", kind: "Calendar", blurb: "Day/week/month calendar with ephemeris", group: "Desk" },
    App { name: "grid", bin: "grid", repo: "grid", kind: "AI-native Spreadsheet", blurb: "A terminal spreadsheet that lets the AI do the…", group: "Desk" },
    App { name: "viewer", bin: "viewer", repo: "viewer", kind: "Universal File Viewer", blurb: "One read-only view for any file", group: "Desk" },
    App { name: "cc-sessions", bin: "cc", repo: "CC-sessions", kind: "Claude Code session manager", blurb: "Bookmark and resume Claude Code sessions with tags", group: "Desk" },
    App { name: "rpnx", bin: "rpnx", repo: "rpnx", kind: "RPN / XRPN Calculator", blurb: "A terminal RPN scientific calculator in the HP…", group: "Desk" },
    App { name: "astro", bin: "astro", repo: "astro", kind: "Astronomy Panel + Telescope Catalog", blurb: "Single amateur-astronomy app", group: "Science" },
    App { name: "stars", bin: "stars", repo: "stars", kind: "HR Diagram Explorer", blurb: "The Hertzsprung-Russell diagram in the terminal", group: "Science" },
    App { name: "particles", bin: "particles", repo: "particles", kind: "Standard Model Explorer", blurb: "The Standard Model chart with every particle's PDG…", group: "Science" },
    App { name: "elements", bin: "elements", repo: "elements", kind: "Periodic Table Explorer", blurb: "The periodic table in your terminal", group: "Science" },
    App { name: "gazette", bin: "gazette", repo: "gazette", kind: "News Reader", blurb: "Reader for your personal daily news digest", group: "Media" },
    App { name: "watchit", bin: "watchit", repo: "watchit", kind: "Movie & Series Browser", blurb: "IMDb Top 250 browser with inline posters, TMDb…", group: "Media" },
    App { name: "tune", bin: "tune", repo: "tune", kind: "Spotify Connect Controller", blurb: "Terminal Spotify controller", group: "Media" },
    App { name: "library", bin: "library", repo: "library", kind: "Generative Library", blurb: "A personal library of the books that should exist", group: "Media" },
    App { name: "amar", bin: "amar", repo: "amar", kind: "RPG Companion", blurb: "Five-tab terminal companion for the Amar RPG", group: "Play" },
    App { name: "melody", bin: "melody", repo: "melody", kind: "Melody Maker", blurb: "Terminal melody maker", group: "Play" },
    App { name: "petri", bin: "petri", repo: "petri", kind: "Petri Net Player", blurb: "Terminal Petri net player", group: "Play" },
    App { name: "typo", bin: "typo", repo: "typo", kind: "Touch-typing Tutor", blurb: "Terminal touch-typing tutor", group: "Play" },
    App { name: "prism", bin: "prism", repo: "prism", kind: "Color Picker", blurb: "TUI color picker with FG/BG slots, R/G/B and H/S/V…", group: "System" },
    App { name: "fonts", bin: "fonts", repo: "fonts", kind: "Font Picker", blurb: "TUI font picker with live previews", group: "System" },
    App { name: "drain", bin: "drain", repo: "drain", kind: "Battery-Drain Triage TUI", blurb: "Top drainers by CPU%, voluntary-context-switches/s…", group: "System" },
    App { name: "torii", bin: "torii", repo: "torii", kind: "Captive-portal listener", blurb: "Replaces Firefox's removed network-login banner", group: "System" },
    App { name: "rush", bin: "rush", repo: "rush", kind: "Shell (retired)", blurb: "Superseded by bare, the assembly shell", group: "Retired" },
    App { name: "crush", bin: "crush", repo: "crush", kind: "Rush Config (retired)", blurb: "Superseded by bareconf", group: "Retired" },
];

/// Logos, embedded so a downloaded binary needs nothing beside it. They
/// are written out to ~/.fe2o3/logos/ on first run, because the image
/// protocols all take a path.
pub const LOGOS: &[(&str, &[u8])] = &[
    ("rush", include_bytes!("../img/logos/rush.png")),
    ("pointer", include_bytes!("../img/logos/pointer.png")),
    ("kastrup", include_bytes!("../img/logos/kastrup.png")),
    ("scribe", include_bytes!("../img/logos/scribe.png")),
    ("scroll", include_bytes!("../img/logos/scroll.png")),
    ("tock", include_bytes!("../img/logos/tock.png")),
    ("grid", include_bytes!("../img/logos/grid.png")),
    ("viewer", include_bytes!("../img/logos/viewer.png")),
    ("cc-sessions", include_bytes!("../img/logos/cc-sessions.png")),
    ("rpnx", include_bytes!("../img/logos/rpnx.png")),
    ("astro", include_bytes!("../img/logos/astro.png")),
    ("stars", include_bytes!("../img/logos/stars.png")),
    ("particles", include_bytes!("../img/logos/particles.png")),
    ("elements", include_bytes!("../img/logos/elements.png")),
    ("gazette", include_bytes!("../img/logos/gazette.png")),
    ("watchit", include_bytes!("../img/logos/watchit.png")),
    ("tune", include_bytes!("../img/logos/tune.png")),
    ("library", include_bytes!("../img/logos/library.png")),
    ("amar", include_bytes!("../img/logos/amar.png")),
    ("melody", include_bytes!("../img/logos/melody.png")),
    ("petri", include_bytes!("../img/logos/petri.png")),
    ("typo", include_bytes!("../img/logos/typo.png")),
    ("crush", include_bytes!("../img/logos/crush.png")),
    ("prism", include_bytes!("../img/logos/prism.png")),
    ("fonts", include_bytes!("../img/logos/fonts.png")),
    ("drain", include_bytes!("../img/logos/drain.png")),
    ("torii", include_bytes!("../img/logos/torii.png")),
];
