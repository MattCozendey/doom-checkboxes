// Copied from https://github.com/diekmann/wasm-fizzbuzz
// Lots of unnecessary code in here

"use strict";
const memory = new WebAssembly.Memory({ initial: 108 });
/*stdout and stderr goes here*/
const output = document.getElementById("output");
const readWasmString = (offset, length) => {
  const bytes = new Uint8Array(memory.buffer, offset, length);
  return new TextDecoder("utf8").decode(bytes);
};
const consoleLogString = (offset, length) => {
  const string = readWasmString(offset, length);
  console.log('"' + string + '"');
};
const appendOutput = (style) => {
  return (offset, length) => {
    const lines = readWasmString(offset, length).split("\n");
    for (let i = 0; i < lines.length; ++i) {
      if (lines[i].length == 0) continue;
      const t = document.createElement("span");
      t.classList.add(style);
      t.appendChild(document.createTextNode(lines[i]));
      output.appendChild(t);
      output.appendChild(document.createElement("br"));
      t.scrollIntoView({
        behavior: "smooth",
        block: "end",
        inline: "nearest",
      }); /*smooth scrolling is experimental according to MDN*/
    }
  };
};

/*stats about how often doom polls the time*/
const getmsps_stats = document.getElementById("getmsps_stats");
const getms_stats = document.getElementById("getms_stats");
let getms_calls_total = 0;
let getms_calls = 0; // in current second
window.setInterval(() => {
  getms_calls_total += getms_calls;
  getmsps_stats.innerText = getms_calls / 1000 + "k";
  getms_stats.innerText = getms_calls_total;
  getms_calls = 0;
}, 1000);

const getMilliseconds = () => {
  ++getms_calls;
  return performance.now();
};

/*doom is rendered here*/
const canvas = document.getElementById("screen");
const doom_screen_width = 320 * 2;
const doom_screen_height = 200 * 2;

/*printing stats*/
const fps_stats = document.getElementById("fps_stats");
const drawframes_stats = document.getElementById("drawframes_stats");
let number_of_draws_total = 0;
let number_of_draws = 0; // in current second
window.setInterval(() => {
  number_of_draws_total += number_of_draws;
  drawframes_stats.innerText = number_of_draws_total;
  fps_stats.innerText = number_of_draws;
  number_of_draws = 0;
}, 1000);

const drawCanvas = (ptr) => {
  const doom_screen = new Uint8ClampedArray(
    memory.buffer,
    ptr,
    doom_screen_width * doom_screen_height * 4
  );
  const render_screen = new ImageData(
    doom_screen,
    doom_screen_width,
    doom_screen_height
  );

  const ctx = canvas.getContext("2d");

  ctx.putImageData(render_screen, 0, 0);

  const base64Image = canvas.toDataURL().replace(/(\r\n|\n|\r)/gm, "");
  console.log(
    "%c X",
    `font-size:400px;color: transparent;background:url(${base64Image}) no-repeat; background-size: contain;margin-top: 140px;margin-left: 60px;`
  );

  ++number_of_draws;
};

/*These functions will be available in WebAssembly. We also share the memory to share larger amounts of data with javascript, e.g. strings of the video output.*/
const importObject = {
  js: {
    js_console_log: appendOutput("log"),
    js_stdout: appendOutput("stdout"),
    js_stderr: appendOutput("stderr"),
    js_milliseconds_since_start: getMilliseconds,
    js_draw_screen: drawCanvas,
  },
  env: {
    memory,
  },
};

let shouldClearConsole = true;
WebAssembly.instantiateStreaming(fetch("doom.wasm"), importObject).then(
  (obj) => {
    /*Initialize Doom*/
    obj.instance.exports.main();

    /*input handling*/
    const doomKeyCode = (keyCode) => {
      // Doom seems to use mostly the same keycodes, except for the following (maybe I'm missing a few.)
      switch (keyCode) {
        case 8:
          return 127; // KEY_BACKSPACE
        case 17:
          return 0x80 + 0x1d; // KEY_RCTRL
        case 18:
          return 0x80 + 0x38; // KEY_RALT
        case 37:
          return 0xac; // KEY_LEFTARROW
        case 38:
          return 0xad; // KEY_UPARROW
        case 39:
          return 0xae; // KEY_RIGHTARROW
        case 40:
          return 0xaf; // KEY_DOWNARROW
        default:
          if (keyCode >= 65 /*A*/ && keyCode <= 90 /*Z*/) {
            return keyCode + 32; // ASCII to lower case
          }
          if (keyCode >= 112 /*F1*/ && keyCode <= 123 /*F12*/) {
            return keyCode + 75; // KEY_F1
          }
          return keyCode;
      }
    };
    const keyDown = (keyCode) => {
      obj.instance.exports.add_browser_event(0 /*KeyDown*/, keyCode);
    };
    const keyUp = (keyCode) => {
      obj.instance.exports.add_browser_event(1 /*KeyUp*/, keyCode);
    };

    /*keyboard input*/
    canvas.addEventListener(
      "keydown",
      (event) => {
        keyDown(doomKeyCode(event.keyCode));
        event.preventDefault();
      },
      false
    );
    canvas.addEventListener(
      "keyup",
      (event) => {
        keyUp(doomKeyCode(event.keyCode));
        event.preventDefault();
      },
      false
    );

    /*mobile touch input*/
    [
      ["enterButton", 13],
      ["leftButton", 0xac],
      ["rightButton", 0xae],
      ["upButton", 0xad],
      ["downButton", 0xaf],
      ["ctrlButton", 0x80 + 0x1d],
      ["spaceButton", 32],
      ["altButton", 0x80 + 0x38],
    ].forEach(([elementID, keyCode]) => {
      const button = document.getElementById(elementID);
      button.addEventListener("touchstart", () => keyDown(keyCode));
      button.addEventListener("touchend", () => keyUp(keyCode));
      button.addEventListener("touchcancel", () => keyUp(keyCode));
    });

    /*hint that the canvas should have focus to capute keyboard events*/
    const focushint = document.getElementById("focushint");
    const printFocusInHint = (e) => {
      focushint.innerText =
        "Keyboard events will be captured as long as the the DOOM canvas has focus.";
      focushint.style.fontWeight = "800";
    };
    canvas.addEventListener("focusin", printFocusInHint, false);
    canvas.addEventListener(
      "focusout",
      (e) => {
        focushint.innerText =
          "Click on the canvas to capute input and start playing.";
        focushint.style.fontWeight = "bold";
      },
      false
    );
    canvas.focus();
    printFocusInHint();

    /*printing stats*/
    const animationfps_stats = document.getElementById("animationfps_stats");
    let number_of_animation_frames = 0; // in current second
    window.setInterval(() => {
      animationfps_stats.innerText = number_of_animation_frames;
      number_of_animation_frames = 0;
    }, 1000);

    /*Main game loop*/
    const step = (timestamp) => {
      // if (shouldClearConsole) {console.clear();}
      ++number_of_animation_frames;
      obj.instance.exports.doom_loop_step();
      shouldClearConsole = false;
      window.requestAnimationFrame(step);
    };
    window.requestAnimationFrame(step);
    window.doomLoaded = true;
  }
);
setInterval(() => {
  shouldClearConsole = true;
}, 3000);

const forwardKey = (e, type) => {
  const ev = new KeyboardEvent(type, {
    key: e.key,
    keyCode: e.keyCode,
  });
  canvas.dispatchEvent(ev);
};
document.body.addEventListener("keydown", (e) => forwardKey(e, "keydown"));
document.body.addEventListener("keyup", (e) => forwardKey(e, "keyup"));
if (!window.doomLoaded) {
  console.log("Loading DOOM...");
}
