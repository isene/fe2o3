// One page for every funkey game: play.html?g=stack. The name only picks
// a row from GAMES below; nothing from the address goes into the page.
(async function () {
  "use strict";
  const K = (k, label, small) => [k, label, small || ""];
  const gap = K("", "");
  const ARROWS = [gap, K("ArrowUp", "↑"), gap, K("ArrowLeft", "←"), gap, K("ArrowRight", "→"), gap, K("ArrowDown", "↓"), gap];
  const QUIT = K("q", "Q", "quit");

  // title, picture size, file, keys help, the pad: moves and keys.
  const GAMES = {
    again: {
      size: [480, 270], file: "wasm/again.wasm?v=1.0",
      help: "Arrows step, <kbd>Space</kbd> waits a step. <kbd>Enter</kbd> lets the rest of the life run out: " +
        "then time starts over, and the self you just were walks beside you. " +
        "<kbd>U</kbd> takes back a step, <kbd>Backspace</kbd> the life, <kbd>R</kbd> the room. <kbd>N</kbd> and <kbd>P</kbd> change rooms.",
      move: ARROWS,
      keys: [K(" ", "Space", "wait"), K("Enter", "Enter", "run on"), K("u", "U", "undo"), K("Backspace", "⌫", "life"),
        K("r", "R", "room"), K("n", "N", "next"), K("p", "P", "back"), QUIT],
    },
    marble: {
      size: [640, 400], file: "wasm/marble.wasm?v=1.0",
      help: "The arrows roll the marble along the tiles: <kbd>→</kbd> is down to the right, <kbd>↓</kbd> is down to the left. " +
        "Two at once roll it straight. <kbd>Space</kbd> starts, <kbd>P</kbd> pauses. " +
        "The buttons under the game roll it the way their arrows point.",
      move: [K("ArrowLeft", "↖"), K("ArrowLeft|ArrowUp", "↑"), K("ArrowUp", "↗"), K("ArrowLeft|ArrowDown", "←"), gap,
        K("ArrowRight|ArrowUp", "→"), K("ArrowDown", "↙"), K("ArrowRight|ArrowDown", "↓"), K("ArrowRight", "↘")],
      keys: [K(" ", "Space", "start"), K("p", "P", "pause"), QUIT],
    },
    vector: {
      size: [640, 400], file: "wasm/vector.wasm?v=1.0",
      help: "<kbd>←</kbd> <kbd>→</kbd> move the claw along the rim, <kbd>Space</kbd> fires down the lane (hold it). " +
        "<kbd>Z</kbd> is the superzapper: once a web it clears the web, a second time it kills one. <kbd>P</kbd> pauses. " +
        "On the title, <kbd>←</kbd> <kbd>→</kbd> pick the web to start at.",
      move: [gap, gap, gap, K("ArrowLeft", "←"), gap, K("ArrowRight", "→")],
      keys: [K(" ", "Space", "fire"), K("z", "Z", "zap"), K("p", "P", "pause"), QUIT],
    },
    stack: {
      size: [480, 270], file: "wasm/stack.wasm?v=1.1",
      help: "<kbd>←</kbd> <kbd>→</kbd> move, <kbd>↑</kbd> turns, <kbd>Z</kbd> turns back, <kbd>↓</kbd> drops soft, " +
        "<kbd>Space</kbd> drops hard, <kbd>C</kbd> holds a piece, <kbd>P</kbd> pauses. " +
        "Make the top ten and your initials join the list everyone who plays here sees.",
      move: [K("z", "↺", "left"), K("ArrowUp", "↻", "right"), K("c", "C", "hold"),
        K("ArrowLeft", "←"), K("ArrowDown", "↓", "soft"), K("ArrowRight", "→")],
      keys: [K(" ", "Space", "drop"), K("Enter", "Enter", "start"), K("p", "P", "pause"), QUIT],
      scores: true,
    },
    eliminator: {
      size: [640, 360], file: "wasm/eliminator.wasm?v=1.3",
      help: "<kbd>i</kbd> on the title shows how Amar's dice and fights work, in three pages. " +
        "Arrows or <kbd>y</kbd> <kbd>u</kbd> <kbd>b</kbd> <kbd>n</kbd> move, walk into a foe to fight. " +
        "<kbd>1</kbd> to <kbd>6</kbd> pick how you strike, <kbd>?</kbd> shows all the keys.",
      move: [K("y", "↖"), K("ArrowUp", "↑"), K("u", "↗"), K("ArrowLeft", "←"), K("s", "wait"),
        K("ArrowRight", "→"), K("b", "↙"), K("ArrowDown", "↓"), K("n", "↘")],
      keys: [K("1", "1", "normal"), K("2", "2", "offence"), K("3", "3", "defence"), K("4", "4", "guard"),
        K("5", "5", "power"), K("6", "6", "double"), K("f", "F", "fire"), K("p", "P", "potion"),
        K("m", "M", "bandage"), K("r", "R", "rest"), K("t", "T", "light"), K("g", "G", "take"),
        K("<", "<", "climb"), K("?", "?", "rules"), K("i", "I", "intro"), QUIT,
        K("Enter", "Enter"), K(" ", "Space"), K("Escape", "Esc"), K("Tab", "Tab")],
      wide: true,
    },
    salvo: {
      size: [480, 270], file: "wasm/salvo.wasm?v=1.0",
      help: "Arrows fly, <kbd>Space</kbd> fires (hold it), <kbd>Z</kbd> takes the lit power-up, <kbd>P</kbd> pauses.",
      move: ARROWS,
      keys: [K(" ", "Space", "fire"), K("z", "Z", "power"), K("p", "P", "pause"), K("Enter", "Enter", "start"), QUIT],
    },
    gems: {
      size: [512, 384], file: "wasm/gems.wasm?v=1.3",
      help: "Arrows walk, two at once for the diagonals, <kbd>Space</kbd> jumps.",
      move: [K("ArrowUp|ArrowLeft", "↖"), K("ArrowUp", "↑"), K("ArrowUp|ArrowRight", "↗"), K("ArrowLeft", "←"), gap,
        K("ArrowRight", "→"), K("ArrowDown|ArrowLeft", "↙"), K("ArrowDown", "↓"), K("ArrowDown|ArrowRight", "↘")],
      keys: [K(" ", "Space", "jump"), K("Enter", "Enter", "start"), QUIT],
    },
    jumpman: {
      size: [256, 192], file: "wasm/jumpman.wasm?v=1.1",
      help: "Arrows run and climb, <kbd>Space</kbd> jumps, <kbd>R</kbd> gives up a life when you are stuck.",
      move: ARROWS,
      keys: [K(" ", "Space", "jump"), K("Enter", "Enter", "start"), K("r", "R", "stuck"), QUIT],
    },
    invaders: {
      size: [224, 256], file: "wasm/invaders.wasm?v=1.0",
      help: "<kbd>←</kbd> <kbd>→</kbd> move, <kbd>Space</kbd> fires.",
      move: [gap, gap, gap, K("ArrowLeft", "←"), gap, K("ArrowRight", "→")],
      keys: [K(" ", "Space", "fire"), K("Enter", "Enter", "start"), QUIT],
    },
    drive: {
      size: [320, 200], file: "wasm/drive.wasm?v=1.0",
      help: "<kbd>↑</kbd> speeds up, <kbd>↓</kbd> brakes, <kbd>←</kbd> <kbd>→</kbd> steer. Fetch the packages before the time runs out.",
      move: ARROWS,
      keys: [K(" ", "Space", "start"), QUIT],
    },
    climb: {
      size: [128, 104], file: "wasm/climb.wasm?v=1.0",
      help: "Arrows walk and climb, <kbd>Space</kbd> jumps, <kbd>R</kbd> starts over.",
      move: ARROWS,
      keys: [K(" ", "Space", "jump"), K("r", "R", "again"), QUIT],
    },
  };

  const name = new URLSearchParams(location.search).get("g");
  const g = Object.prototype.hasOwnProperty.call(GAMES, name) ? GAMES[name] : null;
  if (!g) { document.getElementById("none").hidden = false; return; }

  document.title = name + " · try Fe₂O₃";
  document.getElementById("name").textContent = name;
  document.getElementById("help").innerHTML = g.help;
  document.getElementById("src").href = "https://github.com/isene/funkey/blob/master/examples/" + name + ".rs";
  const box = document.getElementById("game");
  box.hidden = false;
  // Tall games stay on the screen: the width follows the height left.
  box.style.maxWidth = "min(100%, calc(76vh * " + g.size[0] + " / " + g.size[1] + "))";

  const button = ([k, label, small]) => {
    const b = document.createElement("button");
    b.type = "button";
    if (!k) { b.className = "gap"; b.tabIndex = -1; return b; }
    b.dataset.key = k;
    b.textContent = label;
    if (small) { const s = document.createElement("small"); s.textContent = small; b.append(s); }
    return b;
  };
  const group = (cls, list) => {
    const d = document.createElement("div");
    d.className = cls;
    d.append(...list.map(button));
    return d;
  };
  const pad = document.getElementById("pad");
  pad.append(group("move", g.move), group(g.wide ? "keys wide" : "keys", g.keys));
  pad.hidden = !(window.matchMedia && matchMedia("(pointer: coarse)").matches);
  document.getElementById("keys").addEventListener("click", () => { pad.hidden = !pad.hidden; });
  const full = document.getElementById("full");
  if (!document.fullscreenEnabled) full.hidden = true;
  full.addEventListener("click", () => box.requestFullscreen().catch(() => {}));

  const canvas = document.getElementById("screen");
  canvas.setAttribute("aria-label", name);
  const game = await funkey.play(canvas, g.file);
  funkey.pad(pad, game);
  if (!g.scores) return;

  // stack's top ten, shared by everyone who plays it, kept on isene.com.
  // The game asks for the list ("list") and sends a score ("score ABC
  // 12345 40 5"); the list comes back as "scores" and a line per score.
  const SCORES = "https://isene.com/cgi-bin/funkey-scores.rb?game=stack";
  const store = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { return null; } };
  const answer = r => r.ok ? r.text().then(t => game.send("scores\n" + t)) : null;
  game.listen(m => {
    if (m === "list") {
      const n = store("stack-name");
      if (n) game.send("name " + n);
      fetch(SCORES).then(answer).catch(() => {});
    } else if (m.startsWith("score ")) {
      const line = m.slice(6);
      store("stack-name", line.slice(0, 3));
      fetch(SCORES, { method: "POST", body: line }).then(answer).catch(() => {});
    }
  });
})();
