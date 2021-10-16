## :joystick: DOOM via Console.Log()!

<br>

![Preview image of DOOM/DOOM console.log()](https://github.com/healeycodes/doom-checkboxes/blob/main/preview.png)

<br>

[Play it now](https://healeycodes.github.io/doom-checkboxes/) (desktop Chrome/Edge only).

## The Pitch

<br>

Bryan Braun gave us [Checkboxland](https://www.bryanbraun.com/checkboxland/), a unique library for rendering text, shapes, and video, via a grid of checkboxes.

Id software gave us [DOOM](<https://en.wikipedia.org/wiki/Doom_(franchise)>).

Cornelius Diekmann gave us [DOOM via WebAssembly](https://github.com/diekmann/wasm-fizzbuzz).

Healey gave us [DOOM via Checkboxes](https://github.com/healeycodes/doom-checkboxes).

Today, I'm pleased to stand on top of these giants' shoulders, and give you DOOM via Console.log().

## How

DOOM runs via WebAssembly in a hidden `<canvas>`. I use [HTMLCanvasElement.toDataURL()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/toDataURL) to turn this into a base64 encoded string. A Console.log() is called with two arguments, "%c X", which is a random string that is going to be stylized by the next parameter, which is composed of css properties. I then attribute the base 64 into a background-url property, thus rendering it.

```js
const base64Image = canvas.toDataURL().replace(/(\r\n|\n|\r)/gm, "");
console.log(
  "%c X",
  `font-size:400px;color: transparent;background:url(${base64Image}) no-repeat; background-size: contain;margin-top: 140px;margin-left: 60px;`
);
```

> Non-standard: This feature is non-standard and is not on a standards track. Do not use it on production sites facing the Web: it will not work for every user.

Key events are forwarded to the hidden `<canvas>` to avoid focus issues.

```js
const forwardKey = (e, type) => {
  const ev = new KeyboardEvent(type, {
    key: e.key,
    keyCode: e.keyCode,
  });
  canvas.dispatchEvent(ev);
};
document.body.addEventListener("keydown", (e) => forwardKey(e, "keydown"));
document.body.addEventListener("keyup", (e) => forwardKey(e, "keyup"));
```

While the `.wasm` is downloaded and processed, the console displays a loading message.

## Development

```bash
python dev.py
```

Edit files, refresh.
