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
    gems: {
      size: [512, 384], file: "wasm/gems.wasm?v=1.3-0.8",
      help: "Arrows walk, two at once for the diagonals, <kbd>Space</kbd> jumps.",
      move: [K("ArrowUp|ArrowLeft", "↖"), K("ArrowUp", "↑"), K("ArrowUp|ArrowRight", "↗"), K("ArrowLeft", "←"), gap,
        K("ArrowRight", "→"), K("ArrowDown|ArrowLeft", "↙"), K("ArrowDown", "↓"), K("ArrowDown|ArrowRight", "↘")],
      keys: [K(" ", "Space", "jump"), K("Enter", "Enter", "start"), QUIT],
      scores: true,
    },
    invaders: {
      size: [224, 256], file: "wasm/invaders.wasm?v=1.0-0.8",
      help: "<kbd>←</kbd> <kbd>→</kbd> move, <kbd>Space</kbd> fires.",
      move: [gap, gap, gap, K("ArrowLeft", "←"), gap, K("ArrowRight", "→")],
      keys: [K(" ", "Space", "fire"), K("Enter", "Enter", "start"), QUIT],
      scores: true,
    },
    drive: {
      size: [320, 200], file: "wasm/drive.wasm?v=1.0-0.8",
      help: "<kbd>↑</kbd> speeds up, <kbd>↓</kbd> brakes, <kbd>←</kbd> <kbd>→</kbd> steer. Fetch the packages before the time runs out.",
      move: ARROWS,
      keys: [K(" ", "Space", "start"), QUIT],
      scores: true,
    },
    climb: {
      size: [128, 104], file: "wasm/climb.wasm?v=1.0-0.8",
      help: "Arrows walk and climb, <kbd>Space</kbd> jumps, <kbd>R</kbd> starts over.",
      move: ARROWS,
      keys: [K(" ", "Space", "jump"), K("r", "R", "again"), QUIT],
    },
    soar: {
      size: [640, 400], file: "wasm/soar.wasm?v=1.1-0.8",
      help: "<kbd>←</kbd> <kbd>→</kbd> turn, <kbd>↑</kbd> <kbd>↓</kbd> climb and dive, <kbd>W</kbd> <kbd>S</kbd> change speed. " +
        "<kbd>Space</kbd> hands the controls back to the autopilot. There is nothing to win.",
      move: ARROWS,
      keys: [K("w", "W", "faster"), K("s", "S", "slower"), K(" ", "Space", "autopilot"), QUIT],
    },
    castle: {
      size: [480, 300], file: "wasm/castle.wasm?v=1.1-0.8",
      help: "<kbd>↑</kbd> <kbd>↓</kbd> walk, <kbd>←</kbd> <kbd>→</kbd> turn, <kbd>A</kbd> <kbd>D</kbd> sidestep, <kbd>W</kbd> <kbd>S</kbd> change the pace. " +
        "<kbd>Space</kbd> hands the walk back to the autopilot. Stone and the moat stop you. " +
        "Here the picture is half the size it is in a terminal. There is nothing to win.",
      move: ARROWS,
      keys: [K("a", "A", "left"), K("d", "D", "right"), K("w", "W", "faster"), K("s", "S", "slower"), K(" ", "Space", "autopilot"), QUIT],
    },
  };

  const name = new URLSearchParams(location.search).get("g");
  // These moved to the Game Room, with a top ten and comments each.
  const ROOM = ["raid", "blocks", "chomp", "kart", "again", "marble", "vector", "stack", "eliminator", "salvo", "jumpman"];
  if (ROOM.includes(name)) { location.replace("https://isene.com/games/play.html?g=" + name); return; }
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

  // The game's top ten, shared by everyone who plays it here, kept on
  // isene.com. The game asks for the list ("list") and sends a score
  // ("score ABC 12345"; stack adds its rows and level). The list comes
  // back as "scores" and a line per score. The name is a key of GAMES.
  const SCORES = "https://isene.com/cgi-bin/funkey-scores.rb?game=" + name;
  const store = (k, v) => { try { return v === undefined ? localStorage.getItem(k) : localStorage.setItem(k, v); } catch (e) { return null; } };
  const answer = r => r.ok ? r.text().then(t => game.send("scores\n" + t)) : null;
  game.listen(m => {
    if (m === "list") {
      const n = store("funkey-name") || store("stack-name");
      if (n) game.send("name " + n);
      fetch(SCORES).then(answer).catch(() => {});
    } else if (m.startsWith("score ")) {
      const line = m.slice(6);
      store("funkey-name", line.slice(0, 3));
      fetch(SCORES, { method: "POST", body: line }).then(answer).catch(() => {});
    }
  });
})();
