const SPRITES = ['img/butterfly-a-sm.webp', 'img/butterfly-b-sm.webp'];
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

// Small butterflies that flutter on CSS keyframes alone: no JS runs per frame. Each .flock gets data-count of them
// (data-wide on screens 768 px and up), in a band of its height: data-band="top bottom" in %, or from just below the
// element named by data-after down to 56%. Measured once the fonts have set the headline's size.
export function flock() {
  const wide = matchMedia('(min-width: 768px)').matches;
  const els = [...document.querySelectorAll('.flock')];
  let live = true;
  document.fonts.ready.then(() => {
    if (!live) return;
    for (const el of els) {
      const [top, bottom] = el.dataset.band ? el.dataset.band.split(' ').map(Number) : below(el);
      const n = +(wide ? el.dataset.wide : el.dataset.count);
      for (let i = 0; i < n; i++) el.append(butterfly(i, top, bottom));
    }
  });
  return () => {
    live = false;
    for (const el of els) el.replaceChildren();
  };
}

function below(el) {
  const box = el.getBoundingClientRect();
  const after = document.querySelector(el.dataset.after).getBoundingClientRect();
  return [Math.min(55, ((after.bottom - box.top) / box.height) * 100 + 2), 56];
}

function butterfly(i, top, bottom) {
  const el = document.createElement('div');
  el.className = 'bf';
  const vars = {
    '--img': `url(${new URL(SPRITES[i % SPRITES.length], location.href)})`, // absolute: a relative url() in a custom property resolves against the stylesheet
    '--x': `${rand(6, 80)}%`, '--y': `${rand(top, bottom)}%`, '--s': `${rand(38, 64)}px`,
    '--dx': `${rand(-18, 18)}vw`, '--dy': `${rand(0, 4)}svh`,
    '--r0': `${rand(-20, 0)}deg`, '--r1': `${rand(0, 20)}deg`,
    '--d': `${rand(3.5, 6.5)}s`, '--dl': `${rand(-6, 0)}s`, '--f': `${rand(0.18, 0.3)}s`,
  };
  for (const [k, v] of Object.entries(vars)) el.style.setProperty(k, v);
  el.innerHTML = '<i class="l"></i><i class="r"></i>';
  return el;
}

// The peak's one-off burst: about 30 butterflies on one canvas for 2.5 s, then the canvas is removed. The canvas
// starts below the headline and fades out towards its top edge, so no butterfly ever passes behind the words.
export function burst(stage) {
  const canvas = document.createElement('canvas');
  canvas.className = 'burst';
  const headline = stage.querySelector('h2');
  const top = headline.getBoundingClientRect().bottom - stage.getBoundingClientRect().top + 8;
  canvas.style.top = `${top}px`;
  canvas.style.height = `calc(100% - ${top}px)`;
  const dpr = Math.min(2, devicePixelRatio);
  const w = stage.clientWidth, h = stage.clientHeight - top;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  stage.insertBefore(canvas, headline);
  const ctx = canvas.getContext('2d');
  const imgs = SPRITES.map(src => Object.assign(new Image(), { src }));
  const flyers = Array.from({ length: 30 }, (_, i) => {
    const angle = rand(0, Math.PI * 2), speed = rand(0.25, 0.6);
    return {
      img: imgs[i % imgs.length], size: rand(26, 56), phase: rand(0, 6), tilt: rand(-0.5, 0.5),
      vx: Math.cos(angle) * speed * w, vy: Math.sin(angle) * speed * h - 0.2 * h,
    };
  });
  const start = performance.now();
  requestAnimationFrame(function frame(now) {
    const t = (now - start) / 1000;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (t > 2.5) return canvas.remove();
    ctx.globalAlpha = Math.min(1, (2.5 - t) / 0.6);
    for (const f of flyers) {
      const flap = 0.15 + 0.85 * Math.abs(Math.cos(t * 16 + f.phase));
      const cos = Math.cos(f.tilt), sin = Math.sin(f.tilt);
      ctx.setTransform(cos * flap * dpr, sin * flap * dpr, -sin * dpr, cos * dpr, (w / 2 + f.vx * t) * dpr, (h * 0.4 + f.vy * t) * dpr);
      ctx.drawImage(f.img, -f.size / 2, -f.size * 0.38, f.size, f.size * 0.76);
    }
    requestAnimationFrame(frame);
  });
}
