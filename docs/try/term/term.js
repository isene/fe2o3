// term.js: runs a crust app built for a web page (see ../src/web.rs and
// build.sh) in a terminal drawn by xterm.js.
//
//   crustterm.run(element, "rpnx.wasm", { name: "rpnx", keys: send => … });
//
// `keys`, when given, gets a function that sends a key as a button would:
// send("k0 Escape").
//
// The app gets a terminal to draw in and the keys typed into it, and
// nothing else. It runs under WASI, the standard way a WebAssembly program
// asks for things, and this file answers every request for files, a
// network or other programs with "not supported": the app cannot read or
// write the visitor's files, reach any server, or start anything.
//
// A crust app waits for keys; the build runs it through binaryen's
// asyncify, so while it waits the page gets its thread back and the app
// costs nothing.
(function () {
  "use strict";
  const SUCCESS = 0, EBADF = 8, ENOSYS = 52, ESPIPE = 70;
  const NORMAL = 0, UNWINDING = 1, REWINDING = 2;
  const STACK = 1 << 20; // room for the paused app's call stack
  const enc = new TextEncoder(), dec = new TextDecoder();

  // crust's sixteen colours, so the apps look as they do in glass.
  const COLOURS = ["#0a0910", "#f74c00", "#78e68c", "#ffb066", "#5aa9e6", "#c678dd", "#56b6c2", "#d8d6da",
    "#55555f", "#ff7a3d", "#a8f0b4", "#ffd9a0", "#8cc6f0", "#e0a6f0", "#8ee0e8", "#ffffff"];
  const NAMES = ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"];
  const theme = { background: COLOURS[0], foreground: COLOURS[7], cursor: COLOURS[11] };
  NAMES.forEach((n, i) => {
    theme[n] = COLOURS[i];
    theme["bright" + n[0].toUpperCase() + n.slice(1)] = COLOURS[i + 8];
  });

  // Keys the browser keeps: full screen and its own tools.
  const BROWSER = new Set(["F11", "F12"]);
  const NAMED = new Set(["Enter", "Escape", "Tab", "Backspace", "Delete", "Insert", "ArrowUp", "ArrowDown",
    "ArrowLeft", "ArrowRight", "Home", "End", "PageUp", "PageDown",
    "F1", "F2", "F3", "F4", "F5", "F6", "F7", "F8", "F9", "F10"]);
  // What xterm.js itself sends for a few keys, for when it got them first.
  const SEQ = { "\x1b[A": "ArrowUp", "\x1b[B": "ArrowDown", "\x1b[C": "ArrowRight", "\x1b[D": "ArrowLeft",
    "\x1bOA": "ArrowUp", "\x1bOB": "ArrowDown", "\x1bOC": "ArrowRight", "\x1bOD": "ArrowLeft", "\x1b": "Escape" };

  class Exit { constructor(code) { this.code = code; } }

  // A key as crust's web.rs reads it: "k<mods> <key>". Null for keys the
  // browser should keep, or that come as text through xterm.js instead
  // (a phone's keyboard, a dead key, an input method).
  function keyMessage(e) {
    if (e.isComposing || e.metaKey || BROWSER.has(e.key)) return null;
    const k = e.key;
    if (!NAMED.has(k) && [...k].length !== 1) return null;
    if (e.ctrlKey && !e.altKey && (k === "v" || k === "V")) return null; // paste
    const altgr = e.getModifierState && e.getModifierState("AltGraph");
    const mods = (e.shiftKey ? 1 : 0) | (e.altKey && !altgr ? 2 : 0) | (e.ctrlKey && !altgr ? 4 : 0);
    return "k" + mods + " " + k;
  }

  async function run(el, url, opts) {
    opts = opts || {};
    const name = opts.name || "app";
    const term = new Terminal({
      fontFamily: 'ui-monospace, "DejaVu Sans Mono", "Cascadia Mono", Menlo, Consolas, monospace',
      fontSize: 15, scrollback: 0, theme, cursorBlink: false, drawBoldTextInBrightColors: false,
    });
    const fit = new FitAddon.FitAddon();
    term.loadAddon(fit);
    // xterm.js's WebGL renderer draws on a canvas. Its plain renderer
    // needs style blocks of its own, which a page that forbids inline
    // styles does not allow, so load addon-webgl.js where that matters.
    if (window.WebglAddon) {
      try { term.loadAddon(new WebglAddon.WebglAddon()); } catch (e) { console.warn("no WebGL: " + e.message); }
    }
    term.open(el);
    // Big enough to read, small enough for 80 columns where the page is narrow.
    term.options.fontSize = Math.max(9, Math.min(15, Math.floor(el.clientWidth / (80 * 0.62))));
    fit.fit();

    // Keys wait here until the app asks.
    const queue = [];
    let wake = null;
    const push = m => { queue.push(m); if (wake) { const w = wake; wake = null; w(); } };
    // Keys from buttons on the page (opts.keys gets the sender).
    if (opts.keys) opts.keys(push);
    let handled = false;
    term.attachCustomKeyEventHandler(e => {
      if (e.type === "keydown") {
        const m = keyMessage(e);
        handled = m !== null;
        if (handled) { e.preventDefault(); push(m); }
      }
      return !handled;
    });
    term.onData(d => {
      if (SEQ[d]) { push("k0 " + SEQ[d]); return; }
      for (const ch of d) {
        if (ch === "\r") push("k0 Enter");
        else if (ch === "\x7f" || ch === "\b") push("k0 Backspace");
        else if (ch === "\t") push("k0 Tab");
        else if (ch >= " ") push("k0 " + ch);
      }
    });
    let cols = term.cols, rows = term.rows;
    new ResizeObserver(() => {
      fit.fit();
      if (term.cols !== cols || term.rows !== rows) { cols = term.cols; rows = term.rows; push("r"); }
    }).observe(el);

    const mod = await WebAssembly.compile(await (await fetch(url)).arrayBuffer());
    term.focus();
    for (;;) {
      let note;
      try {
        await start(mod, term, name, queue, w => { wake = w; }, () => { wake = null; });
        note = name + " has ended.";
      } catch (e) {
        console.error(e);
        note = name + " stopped with an error.";
      }
      term.write("\x1b[0m\x1b[?1049l\r\n\x1b[33m" + note + " Press a key to start it again.\x1b[0m");
      queue.length = 0;
      await new Promise(r => { wake = r; });
      queue.length = 0;
      term.reset();
    }
  }

  // One run of the app, from start to exit.
  async function start(mod, term, name, queue, setWake, clearWake) {
    let inst, state = NORMAL, pending = null, result = 0, data = 0;
    const mem = () => inst.exports.memory.buffer;
    const view = () => new DataView(mem());
    const bytes = (p, n) => new Uint8Array(mem(), p, n);

    // An import that may wait: it pauses the app (asyncify unwinds its
    // stack into `data`), the page awaits, then the app resumes where it
    // stopped and the import returns the answer.
    const waits = fn => (...args) => {
      if (state === REWINDING) {
        inst.exports.asyncify_stop_rewind();
        state = NORMAL;
        return result;
      }
      const r = fn(...args);
      if (!(r instanceof Promise)) return r;
      pending = r;
      view().setUint32(data, data + 8, true);
      view().setUint32(data + 4, data + STACK, true);
      inst.exports.asyncify_start_unwind(data);
      state = UNWINDING;
      return 0;
    };

    const put = (p, n, msg) => {
      const b = enc.encode(msg).slice(0, n);
      bytes(p, b.length).set(b);
      return b.length;
    };
    const key = (p, n, ms) => {
      if (queue.length) return put(p, n, queue.shift());
      if (ms === 0) return 0;
      return new Promise(resolve => {
        let timer = null;
        setWake(() => { if (timer) clearTimeout(timer); resolve(put(p, n, queue.shift())); });
        if (ms > 0) timer = setTimeout(() => { clearWake(); resolve(0); }, ms);
      });
    };
    const size = () => ((term.cols & 0xffff) << 16) | (term.rows & 0xffff);

    // Text lists for the app: its name as the only argument, and a few
    // settings. HOME names a folder that does not exist here.
    const args = [name];
    const env = ["TERM=xterm-256color", "COLORTERM=truecolor", "LANG=en_US.UTF-8", "HOME=/nowhere", "FE2O3_WEB=1"];
    const sizes = (list, countP, sizeP) => {
      view().setUint32(countP, list.length, true);
      view().setUint32(sizeP, list.reduce((a, s) => a + enc.encode(s).length + 1, 0), true);
      return SUCCESS;
    };
    const fill = (list, ptrs, buf) => {
      for (const s of list) {
        view().setUint32(ptrs, buf, true); ptrs += 4;
        const b = enc.encode(s + "\0");
        bytes(buf, b.length).set(b); buf += b.length;
      }
      return SUCCESS;
    };

    const wasi = {
      args_sizes_get: (c, s) => sizes(args, c, s),
      args_get: (p, b) => fill(args, p, b),
      environ_sizes_get: (c, s) => sizes(env, c, s),
      environ_get: (p, b) => fill(env, p, b),
      clock_res_get: (id, p) => { view().setBigUint64(p, 1000n, true); return SUCCESS; },
      clock_time_get: (id, _prec, p) => {
        const ns = id === 0 ? BigInt(Date.now()) * 1000000n : BigInt(Math.round(performance.now() * 1e6));
        view().setBigUint64(p, ns, true);
        return SUCCESS;
      },
      random_get: (p, n) => {
        for (let i = 0; i < n; i += 65536) crypto.getRandomValues(bytes(p + i, Math.min(65536, n - i)));
        return SUCCESS;
      },
      // Standard out is the terminal; standard error goes to the console.
      fd_write: (fd, iovs, n, outP) => {
        if (fd !== 1 && fd !== 2) return EBADF;
        let total = 0;
        const parts = [];
        for (let i = 0; i < n; i++) {
          const p = view().getUint32(iovs + i * 8, true), len = view().getUint32(iovs + i * 8 + 4, true);
          parts.push(bytes(p, len).slice());
          total += len;
        }
        for (const b of parts) { if (fd === 1) term.write(b); else console.warn(name + ": " + dec.decode(b)); }
        view().setUint32(outP, total, true);
        return SUCCESS;
      },
      fd_read: (fd, _iovs, _n, outP) => {
        if (fd !== 0) return EBADF;
        view().setUint32(outP, 0, true); // keys come through crust, never stdin
        return SUCCESS;
      },
      fd_fdstat_get: (fd, p) => {
        if (fd > 2) return EBADF;
        new Uint8Array(mem(), p, 24).fill(0);
        view().setUint8(p, 2); // a character device, like a terminal
        return SUCCESS;
      },
      fd_fdstat_set_flags: fd => (fd > 2 ? EBADF : SUCCESS),
      fd_prestat_get: () => EBADF, // no folders are shared with the app
      fd_prestat_dir_name: () => EBADF,
      fd_close: fd => (fd > 2 ? EBADF : SUCCESS),
      fd_seek: fd => (fd > 2 ? EBADF : ESPIPE),
      fd_filestat_get: () => EBADF,
      sched_yield: () => SUCCESS,
      proc_exit: code => { throw new Exit(code); },
      // A sleep: the one kind of wait a crust app asks for here.
      poll_oneoff: waits((inP, outP, n, countP) => {
        let wait = null, user = 0n;
        for (let i = 0; i < n; i++) {
          const s = inP + i * 48;
          if (view().getUint8(s + 8) !== 0) continue; // only clocks
          let ns = view().getBigUint64(s + 24, true);
          if (view().getUint16(s + 40, true) & 1) ns -= BigInt(Math.round(performance.now() * 1e6)); // an absolute time
          if (wait === null || ns < wait) { wait = ns; user = view().getBigUint64(s, true); }
        }
        const done = () => {
          new Uint8Array(mem(), outP, 32).fill(0);
          view().setBigUint64(outP, user, true);
          view().setUint32(countP, 1, true);
          return SUCCESS;
        };
        if (wait === null) { view().setUint32(countP, 0, true); return SUCCESS; }
        const ms = Number(wait > 0n ? wait : 0n) / 1e6;
        return new Promise(r => setTimeout(() => r(done()), ms));
      }),
    };
    // Everything else a WASI program may ask for (files, sockets) is not here.
    const deny = new Proxy(wasi, { get: (t, k) => (k in t ? t[k] : () => ENOSYS) });
    const crust = { key: waits(key), size };

    inst = await WebAssembly.instantiate(mod, { wasi_snapshot_preview1: deny, crust });
    data = inst.exports.memory.grow(STACK / 65536 + 1) * 65536;
    try {
      for (;;) {
        inst.exports._start();
        if (state !== UNWINDING) return;
        inst.exports.asyncify_stop_unwind();
        state = NORMAL;
        result = await pending;
        inst.exports.asyncify_start_rewind(data);
        state = REWINDING;
      }
    } catch (e) {
      if (!(e instanceof Exit)) throw e;
    }
  }

  window.crustterm = { run };
})();
