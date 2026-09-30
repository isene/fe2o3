// One page for every terminal app: app.html?a=rpnx. The name only picks
// a row from APPS below; nothing from the address goes into the page.
(function () {
  "use strict";
  // file, the app's GitHub repo, keys help.
  const APPS = {
    rpnx: {
      file: "apps/rpnx.wasm?v=0.1.1", repo: "rpnx",
      help: "Type a number, <kbd>Enter</kbd>, another, then an operator: <kbd>3</kbd> <kbd>Enter</kbd> " +
        "<kbd>4</kbd> <kbd>+</kbd> gives 7. <kbd>q</kbd> is the square root, <kbd>i</kbd> <kbd>o</kbd> " +
        "<kbd>a</kbd> sin, cos and tan, <kbd>Tab</kbd> cycles the shift pages, <kbd>:</kbd> runs any XRPN command by name.",
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

  crustterm.run(document.getElementById("screen"), a.file, { name, keys: k => { send = k; } });
})();
