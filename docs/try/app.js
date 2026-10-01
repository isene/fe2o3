// One page for every terminal app: app.html?a=rpnx. The name only picks
// a row from APPS below; nothing from the address goes into the page.
(function () {
  "use strict";
  // file, the app's GitHub repo, keys help.
  const APPS = {
    rpnx: {
      file: "apps/rpnx.wasm?v=0.1.1-2", repo: "rpnx",
      help: "Type a number, <kbd>Enter</kbd>, another, then an operator: <kbd>3</kbd> <kbd>Enter</kbd> " +
        "<kbd>4</kbd> <kbd>+</kbd> gives 7. <kbd>q</kbd> is the square root, <kbd>i</kbd> <kbd>o</kbd> " +
        "<kbd>a</kbd> sin, cos and tan, <kbd>Tab</kbd> cycles the shift pages, <kbd>:</kbd> runs any XRPN command by name.",
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

  crustterm.run(document.getElementById("screen"), a.file, { name, keys: k => { send = k; }, files: a.files });
})();
