// One page for every terminal app: app.html?a=rpnx. The name only picks
// a row from APPS below; nothing from the address goes into the page.
(function () {
  "use strict";
  // file, the app's GitHub repo, keys help.
  const APPS = {
    rpnx: {
      file: "apps/rpnx.wasm?v=0.1.2-1", repo: "rpnx",
      help: "Type a number, <kbd>Enter</kbd>, another, then an operator: <kbd>3</kbd> <kbd>Enter</kbd> " +
        "<kbd>4</kbd> <kbd>+</kbd> gives 7. <kbd>q</kbd> is the square root, <kbd>i</kbd> <kbd>o</kbd> " +
        "<kbd>a</kbd> sin, cos and tan, <kbd>Tab</kbd> cycles the shift pages, <kbd>:</kbd> runs any XRPN command by name.",
      // HP-41 programs, loaded as they were keyed: [file, name, its repo, what it does and how to run it].
      programs: [
        ["Math", [
          ["COMB", "COMB and PERM", "hp-41_GEIR.ROM", "Combinations and permutations. Key n, Enter, r. F1 gives " +
            "the combinations, F2 the permutations: 10, Enter, 3 gives 120 and 720."],
          ["LW", "Lambert W", "hp-41_wlambert", "The W function. Key x, then F1 for the upper branch or F2 for " +
            "the lower: 1 gives 0.5671."],
          ["RNR", "RNR", "hp-41_GEIR.ROM", "Rounds x to the nearest 1/n. Key x, Enter, n, then F1: 3.14159, Enter, 4 gives 3.25."],
          ["TPERC", "T%", "hp-41_GEIR.ROM", "What percent one number is of another. Key the total, Enter, the part, " +
            "then F1: 200, Enter, 50 gives 25."],
          ["DPERC", "D%", "hp-41_GEIR.ROM", "The change from one number to another, in percent. Key the old, Enter, " +
            "the new, then F1: 200, Enter, 250 gives 25."],
        ]],
        ["Business and IT", [
          ["SUBN", "SUBN", "hp-41_subn", "How many IP addresses a subnet holds. Key the prefix length, then F1: 26 gives 64."],
          ["SLA", "SLA", "hp-41_sla", "The guaranteed uptime of a system built from parts. F1 starts. Key a part's " +
            "uptime in percent and press F2. F3 opens a group of parallel parts, F4 closes it."],
          ["LUHN", "LUHN", "hp-41_luhn", "Checks a credit card or IMEI number. Put it in Alpha: type : then the " +
            "number in double quotes, and Enter. F1 says VALID or INVALID."],
        ]],
        ["Astronomy", [
          ["MAG", "MAG", "hp-41_AMASTRO.ROM", "How many times brighter one star is than another. Key one magnitude, " +
            "Enter, the other, then F1: 1, Enter, 6 gives 100."],
        ]],
        ["Dates", [
          ["DMD", "DMD", "hp-41_isene-rom", "Turns MM.DD into DD.MM and back. Key the date, then F1: 12.31 gives 31.12."],
        ]],
        ["Colours", [
          ["CLUMIN", "CLUMIN", "hp-41_colorluminosity", "The brightness of a colour. Put the hex code in Alpha: type : " +
            "then \"A854F3\" with the quotes, and Enter. F1 shows it in percent."],
        ]],
      ],
    },
    circuit: {
      file: "apps/circuit.wasm?v=0.2.4-2", repo: "circuit",
      help: "Arrows move. <kbd>1</kbd> to <kbd>6</kbd> add a battery, resistor, capacitor, LED, switch or transistor, " +
        "<kbd>w</kbd> draws a wire, <kbd>p</kbd> turns the power on. <kbd>n</kbd> gives the next challenge, " +
        "<kbd>?</kbd> every key. Boards are not saved here.",
    },
    exoplanets: {
      file: "apps/exoplanets.wasm?v=0.1.1-2", repo: "exoplanets",
      help: "Arrows walk the chart of 6,309 planets, <kbd>Enter</kbd> shows a planet's whole system with its " +
        "habitable zone, <kbd>1</kbd> to <kbd>6</kbd> change the colours, <kbd>/</kbd> finds a planet or star.",
    },
    fractal: {
      file: "apps/fractal.wasm?v=0.1.5-2", repo: "fractal",
      help: "Arrows pan, <kbd>+</kbd> <kbd>-</kbd> zoom, <kbd>1</kbd> to <kbd>5</kbd> pick Mandelbrot, Julia, " +
        "the logistic map, Lorenz or Hénon. <kbd>J</kbd> goes from a point to its Julia set.",
    },
    alchemy: {
      file: "apps/alchemy.wasm?v=0.1.5-3", repo: "alchemy",
      help: "<kbd>Space</kbd> opens the shelf to pour something in, <kbd>h</kbd> lights the burner, " +
        "<kbd>t</kbd> makes a flame test, <kbd>x</kbd> lists the experiments, <kbd>?</kbd> every key.",
    },
    isotopes: {
      file: "apps/isotopes.wasm?v=0.1.9-3", repo: "isotopes",
      help: "Arrows walk the chart of 3,386 nuclides, <kbd>Enter</kbd> follows a decay chain to its end, " +
        "<kbd>z</kbd> shows the whole chart, <kbd>/</kbd> finds one: <kbd>U-238</kbd>, <kbd>14C</kbd>.",
    },
    moon: {
      file: "apps/moon.wasm?v=0.1.12-2", repo: "moon",
      help: "The Moon as it looks tonight. <kbd>←</kbd> <kbd>→</kbd> step a day, <kbd>Tab</kbd> opens the map, " +
        "<kbd>/</kbd> finds a crater or a sea, <kbd>f</kbd> shows it as in a telescope.",
    },
    universe: {
      file: "apps/universe.wasm?v=0.3.2-3", repo: "universe",
      help: "<kbd>↑</kbd> steps out, <kbd>↓</kbd> steps in, from the quantum foam to the cosmic web. " +
        "<kbd>PgUp</kbd> <kbd>PgDn</kbd> go five rungs at a time, <kbd>H</kbd> goes back to the human body.",
    },
    elements: {
      file: "apps/elements.wasm?v=0.1.15-2", repo: "elements",
      files: { "/home/web/.elements/elements.json": "data/elements.json?v=1" },
      help: "Arrows walk the periodic table, <kbd>1</kbd> to <kbd>9</kbd> colour it, <kbd>Space</kbd> pages through " +
        "the element's article, <kbd>/</kbd> finds one. Articles from <a href=\"https://en.wikipedia.org\">Wikipedia</a>, " +
        "<a href=\"https://creativecommons.org/licenses/by-sa/4.0/\">CC BY-SA 4.0</a>.",
    },
    particles: {
      file: "apps/particles.wasm?v=0.1.6-3", repo: "particles",
      files: { "/home/web/.particles/particles.json": "data/particles.json?v=1" },
      help: "Arrows walk the Standard Model, <kbd>Tab</kbd> switches to the zoom into a carbon atom, <kbd>+</kbd> " +
        "<kbd>-</kbd> go down and up it. Articles from <a href=\"https://en.wikipedia.org\">Wikipedia</a>, " +
        "<a href=\"https://creativecommons.org/licenses/by-sa/4.0/\">CC BY-SA 4.0</a>.",
    },
    stars: {
      file: "apps/stars.wasm?v=0.2.6-3", repo: "stars",
      files: { "/home/web/.stars/stars.json": "data/stars.json?v=1" },
      help: "Arrows walk the Hertzsprung-Russell diagram, <kbd>1</kbd> to <kbd>7</kbd> colour it, <kbd>t</kbd> lays " +
        "the paths stars take over it, <kbd>M</kbd> shows the sky. Stars from the HYG catalog and Wikidata, articles " +
        "from <a href=\"https://en.wikipedia.org\">Wikipedia</a>, " +
        "<a href=\"https://creativecommons.org/licenses/by-sa/4.0/\">CC BY-SA 4.0</a>.",
    },
    sky: {
      file: "apps/sky.wasm?v=0.1.10-2", repo: "starmap",
      help: "Give your latitude and longitude, then the sky over you now: zenith in the middle, the horizon " +
        "at the rim. Arrows move the crosshair, <kbd>+</kbd> <kbd>-</kbd> zoom, <kbd>c</kbd> <kbd>n</kbd> turn the " +
        "figures and names on and off, <kbd>Enter</kbd> names a star, <kbd>Esc</kbd> goes back to the place.",
    },
  };
  // Keys a phone's keyboard lacks.
  const PAD = [["Escape", "Esc"], ["Tab", "Tab"], ["ArrowLeft", "←"], ["ArrowUp", "↑"], ["ArrowDown", "↓"],
    ["ArrowRight", "→"], ["Backspace", "⌫"], ["Enter", "Enter"]];

  const name = new URLSearchParams(location.search).get("a");
  const a = Object.prototype.hasOwnProperty.call(APPS, name) ? APPS[name] : null;
  if (!a) { document.getElementById("none").hidden = false; return; }

  document.title = name + " · try Fe₂O₃";
  document.getElementById("name").textContent = name;
  document.getElementById("help").innerHTML = a.help;
  document.getElementById("repo").href = "https://github.com/isene/" + a.repo;
  const box = document.getElementById("app");
  box.hidden = false;

  const pad = document.getElementById("pad");
  let send = null;
  for (const [k, label] of PAD) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = label;
    b.addEventListener("pointerdown", e => { e.preventDefault(); if (send) send("k0 " + k); });
    pad.append(b);
  }
  pad.hidden = !(window.matchMedia && matchMedia("(pointer: coarse)").matches);
  document.getElementById("keys").addEventListener("click", () => { pad.hidden = !pad.hidden; });
  const full = document.getElementById("full");
  if (!document.fullscreenEnabled) full.hidden = true;
  full.addEventListener("click", () => box.requestFullscreen().catch(() => {}));

  // The program library: a click loads a listing the way the L key does,
  // and F1 to F5 are here as buttons too, for phones.
  const files = Object.assign({}, a.files);
  if (a.programs) {
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text) e.textContent = text; return e; };
    const press = (b, keys) => b.addEventListener("pointerdown", e => { e.preventDefault(); if (send) keys.forEach(k => send(k)); });
    const lib = el("div", "library");
    lib.append(el("h2", null, "HP-41 programs"));
    const about = el("p", "about", "Pick one. It loads as it was keyed on the HP-41, step numbers and all.");
    const run = el("div", "run");
    run.append(el("span", null, "Run"));
    for (let n = 1; n <= 5; n++) { const b = el("button", null, "F" + n); b.type = "button"; press(b, ["k0 F" + n]); run.append(b); }
    for (const [cat, progs] of a.programs) {
      const row = el("div", "shelf");
      row.append(el("span", null, cat));
      for (const [file, label, repo, text] of progs) {
        files["/home/web/" + file + ".41"] = "programs/" + file + ".41?v=1";
        const b = el("button", null, label);
        b.type = "button";
        press(b, ["k0 L", "p~/" + file + ".41", "k0 Enter"]);
        b.addEventListener("pointerdown", () => {
          for (const o of lib.querySelectorAll(".shelf button.on")) o.classList.remove("on");
          b.classList.add("on");
          const src = el("a", null, "The listing");
          src.href = "https://github.com/isene/" + repo;
          about.replaceChildren(el("strong", null, label + ". "), text + " ", src);
        });
        row.append(b);
      }
      lib.append(row);
    }
    lib.append(run, about);
    document.getElementById("help").after(lib);
  }

  crustterm.run(document.getElementById("screen"), a.file, { name, keys: k => { send = k; }, files });
})();
