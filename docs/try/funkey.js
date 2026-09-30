// funkey.js: plays a funkey game built for the web (see lib.rs) in a canvas.
//
//   const game = await funkey.play(canvas, "eliminator.wasm");
//   funkey.pad(element, game);   // optional: keys on the screen
//
// A clear text field lies over the canvas and takes the keys. Browsers
// with keys of their own (gaze, qutebrowser, Vimium) pass keys to a page
// only while a text field has the focus. funkey.pad turns the buttons in
// an element that carry a data-key ("ArrowUp", "f", "Enter", " ") into
// keys, for phones. The sound starts with the first click, tap or key: a
// browser plays nothing before that.
(function () {
  "use strict";
  // The keys with names, as src/web.rs numbers them.
  const CODES = { ArrowUp: 1, ArrowDown: 2, ArrowLeft: 3, ArrowRight: 4, Enter: 5, Escape: 6, Tab: 7, Backspace: 8 };
  const code = k => CODES[k] || (k.length === 1 ? k.toLowerCase().codePointAt(0) : 0);
  const touch = window.matchMedia && matchMedia("(pointer: coarse)").matches;

  async function play(canvas, url) {
    const bytes = await (await fetch(url)).arrayBuffer();
    const fk = (await WebAssembly.instantiate(bytes, {})).instance.exports;
    fk.fk_start((Math.random() * 4294967296) >>> 0);
    const w = fk.fk_width(), h = fk.fk_height(), rate = fk.fk_rate();
    canvas.style.aspectRatio = w + " / " + h;

    // The canvas in a box, and the field over it.
    const box = document.createElement("div");
    box.className = "fk";
    box.style.position = "relative";
    canvas.parentNode.insertBefore(box, canvas);
    const field = document.createElement("textarea");
    field.setAttribute("inputmode", "none");
    field.setAttribute("autocapitalize", "off");
    field.setAttribute("aria-label", canvas.getAttribute("aria-label") || "The game");
    field.autocomplete = "off";
    field.spellcheck = false;
    field.style.cssText = "position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;"
      + "opacity:0;resize:none;cursor:pointer;caret-color:transparent";
    box.append(canvas, field);

    // The game's own pixels, then drawn a whole number of times larger,
    // so every pixel stays square at any size.
    const off = document.createElement("canvas");
    off.width = w; off.height = h;
    const octx = off.getContext("2d");
    const image = octx.createImageData(w, h);
    const ctx = canvas.getContext("2d");
    function fit() {
      const k = Math.max(1, Math.ceil(canvas.clientWidth * (window.devicePixelRatio || 1) / w));
      if (canvas.width !== w * k) { canvas.width = w * k; canvas.height = h * k; }
      ctx.imageSmoothingEnabled = false;
    }

    // Sound: the game's mix, a little ahead of the clock.
    let audio = null, next = 0;
    function wake() {
      if (!audio) {
        const AC = window.AudioContext || window.webkitAudioContext;
        try { audio = new AC({ sampleRate: rate }); } catch (e) { audio = new AC(); }
      }
      if (audio.state !== "running") audio.resume();
    }
    function pump() {
      if (!audio || audio.state !== "running") return;
      if (next < audio.currentTime) next = audio.currentTime + 0.03;
      const n = Math.floor((audio.currentTime + 0.15 - next) * rate);
      if (n < 256) return;
      const pcm = new Float32Array(fk.memory.buffer, fk.fk_sound(n), n);
      const buf = audio.createBuffer(1, n, rate);
      buf.getChannelData(0).set(pcm);
      const src = audio.createBufferSource();
      src.buffer = buf;
      src.connect(audio.destination);
      src.start(next);
      next += n / rate;
    }

    // Keys. A key lets go with the code it went down with, whatever
    // Shift did in between.
    const held = new Map();
    field.addEventListener("pointerdown", wake);
    field.addEventListener("keydown", e => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const c = code(e.key);
      if (!c) return;
      e.preventDefault();
      wake();
      if (e.repeat || held.has(e.code)) return;
      held.set(e.code, c);
      fk.fk_key(c, 1);
    });
    field.addEventListener("keyup", e => {
      const c = held.get(e.code);
      if (c === undefined) return;
      held.delete(e.code);
      fk.fk_key(c, 0);
    });
    field.addEventListener("input", () => { field.value = ""; });
    field.addEventListener("focus", () => box.classList.add("on"));
    field.addEventListener("blur", () => {
      box.classList.remove("on");
      for (const c of held.values()) fk.fk_key(c, 0);
      held.clear();
    });

    // Keys from buttons on the screen.
    let tapped = false;
    function key(name, down) {
      const c = code(name);
      if (!c) return;
      if (down) { wake(); tapped = true; }
      fk.fk_key(c, down ? 1 : 0);
    }

    // Messages between the game and the page's script (src/page.rs). A
    // game built before they existed has no fk_out, and none go.
    const enc = new TextEncoder(), dec = new TextDecoder();
    let listener = null;
    function send(text) {
      if (!fk.fk_in) return;
      const b = enc.encode(text);
      new Uint8Array(fk.memory.buffer, fk.fk_in(b.length), b.length).set(b);
      fk.fk_in_done();
    }
    function drain() {
      // Messages wait in the game until someone listens.
      if (!fk.fk_out || !listener) return;
      for (let n = fk.fk_out(); n; n = fk.fk_out()) {
        const text = dec.decode(new Uint8Array(fk.memory.buffer, fk.fk_out_ptr(), n).slice());
        if (listener) listener(text);
      }
    }

    // Nothing runs while the game is out of sight, so a page can hold a
    // game without costing the reader's battery.
    let seen = true, running = false;
    const go = () => { if (seen && !running) { running = true; requestAnimationFrame(tick); } };
    if (window.IntersectionObserver) {
      new IntersectionObserver(es => { seen = es[es.length - 1].isIntersecting; go(); }).observe(box);
    }

    function tick(ms) {
      if (!seen) { running = false; return; }
      if (fk.fk_frame(ms)) {
        fit();
        image.data.set(new Uint8ClampedArray(fk.memory.buffer, fk.fk_pixels(), w * h * 4));
        octx.putImageData(image, 0, 0);
        ctx.drawImage(off, 0, 0, canvas.width, canvas.height);
        if (document.activeElement !== field && !tapped) {
          ctx.fillStyle = "rgba(0,0,0,0.6)";
          ctx.fillRect(0, canvas.height * 0.42, canvas.width, canvas.height * 0.16);
          ctx.fillStyle = "#ffd040";
          ctx.font = "bold " + Math.round(canvas.height / 16) + "px monospace";
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(touch ? "TAP TO PLAY" : "CLICK TO PLAY", canvas.width / 2, canvas.height / 2);
        }
      }
      pump();
      drain();
      requestAnimationFrame(tick);
    }
    go();
    // The game may have spoken while it started.
    return { key, box, send, listen: fn => { listener = fn; drain(); } };
  }

  // Every button with a data-key in `el` presses that key while a finger
  // or the mouse is on it, so a held arrow walks. "ArrowUp|ArrowLeft"
  // presses both, for a diagonal.
  function pad(el, game) {
    for (const b of el.querySelectorAll("[data-key]")) {
      const ks = b.dataset.key === "|" ? ["|"] : b.dataset.key.split("|");
      let down = false;
      const up = () => {
        if (!down) return;
        down = false;
        b.classList.remove("down");
        for (const k of ks) game.key(k, false);
      };
      b.addEventListener("pointerdown", e => {
        e.preventDefault();
        b.setPointerCapture(e.pointerId);
        down = true;
        b.classList.add("down");
        for (const k of ks) game.key(k, true);
      });
      b.addEventListener("pointerup", up);
      b.addEventListener("pointercancel", up);
      b.addEventListener("lostpointercapture", up);
      b.addEventListener("contextmenu", e => e.preventDefault());
    }
  }

  window.funkey = { play, pad };
})();
