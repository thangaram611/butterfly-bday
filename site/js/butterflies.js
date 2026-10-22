const SPRITES = ['img/butterfly-a-sm.webp', 'img/butterfly-b-sm.webp'];
const rand = (lo, hi) => lo + Math.random() * (hi - lo);

// Small butterflies that flutter on CSS keyframes alone: no JS runs per frame. Each .flock gets data-count of them
// (data-wide on screens 768 px and up), in a band of its height: data-band="top bottom" in %, or from just below the
// element named by data-after down to just above the one named by data-until. Measured once the fonts have set the
// words' sizes.
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
  const box = el.getBoundingClientRect(), pct = y => ((y - box.top) / box.height) * 100;
  const top = pct(document.querySelector(el.dataset.after).getBoundingClientRect().bottom) + 2;
  const bottom = pct(document.querySelector(el.dataset.until).getBoundingClientRect().top) - 12; // a butterfly is ~8% tall
  return [top, Math.max(top, bottom)];
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
  stage.insertBefore(canvas, stage.querySelector('.her') || headline);
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

// The guest's own butterflies, the signature move (BRIEF.md): the first scroll releases one from under the finger and
// each tap another, up to MAX. guide() (js/story.js) says where they're wanted: round the caterpillar, on the twig, with
// the new butterfly down to her, away for the details, then on the edges of "Tell us you're coming". Each one is a
// spring towards its place, so it lags a little, overshoots and catches up, and the world sweeps it along as the thumb
// flicks. They fly on the stage, and in the close for its ending, in that one's own px (so the close carries them as
// it scrolls); they change over while off the side of the screen.
const MAX = 8;
// round the caterpillar or the new butterfly, in px: either side of it and along it
const AROUND = [[-70, -40], [75, 10], [-60, 60], [70, -70], [-95, -5], [95, 55], [-40, -100], [45, 100]];
// on the button: along its top (-1) or bottom (1) edge, or on its round ends (0), clear of its words
const SPOTS = [[0.84, -1], [0, 0], [0.2, 1], [0.16, -1], [1, 0], [0.8, 1], [0.5, -1], [0.5, 1]];

export function signature(guide) {
  const stage = document.querySelector('.stage .guests'), close = document.querySelector('.close .guests');
  const button = document.querySelector('.coming');
  const guests = [];
  let down, raf = 0, last = 0, cam, home = stage, spot;

  function release(x, y) {
    if (guests.length === MAX) { // the nearest one flutters up instead
      const g = guests.reduce((a, b) => (Math.hypot(b.p[0] - x, b.p[1] - y) < Math.hypot(a.p[0] - x, a.p[1] - y) ? b : a));
      g.v[1] -= 320;
      g.perched = false;
      return wake();
    }
    const i = guests.length, s = innerWidth >= 768 ? 42 : 34, el = document.createElement('div'), box = home.getBoundingClientRect();
    const g = { el, i, s, h: (s * 779) / 1024, f: `${rand(0.16, 0.24)}s`, tilt: rand(-10, 10), p: [x - box.left, y - box.top], v: [rand(-90, 90), -280], born: performance.now(), layer: home, perched: false };
    el.className = 'bf guest';
    el.style.setProperty('--img', `url(${new URL(SPRITES[i % SPRITES.length], location.href)})`);
    el.style.setProperty('--s', `${s}px`);
    el.style.setProperty('--f', g.f);
    el.innerHTML = '<i class="l"></i><i class="r"></i>';
    home.append(el);
    guests.push(g);
    wake();
  }

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000), t = now / 1000;
    last = now;
    const { phase, at, perches, cam: c } = guide(), W = innerWidth;
    const sweep = cam === undefined ? 0 : Math.max(-60, Math.min(60, 0.5 * (c - cam))); // the world carries them a little
    cam = c;
    stage.style.zIndex = phase === 'vine' ? 4 : 7; // behind the vine's paper tags; in front of the twig and of her
    home = phase === 'close' ? close : stage;
    let b, busy = false;
    if (phase === 'close') { // the button, in the close's px; it rises a little as the close comes in
      const r = button.getBoundingClientRect(), o = close.getBoundingClientRect();
      b = { left: r.left - o.left, top: r.top - o.top, width: r.width, height: r.height };
      busy = spot !== (spot = `${b.left} ${b.top}`);
    }
    for (const g of guests) {
      const side = x => (x < W / 2 ? -g.s : W + g.s); // off the nearer side
      let place, perch = true;
      if (phase === 'twig') place = [perches[g.i][0], perches[g.i][1] - g.h / 2 + 4]; // standing on it
      else if (phase === 'close') {
        const [fx, edge] = SPOTS[g.i];
        const end = 23 - g.s / 2; // 4 px short of its words (they start 27 px in)
        place = [b.left + (fx === 0 ? end : fx === 1 ? b.width - end : fx * b.width), b.top + (edge < 0 ? 11 - g.h / 2 : edge > 0 ? b.height - 11 + g.h / 2 : b.height / 2)];
      } else if (phase === 'away') place = [side(g.p[0]), g.p[1]];
      else {
        perch = false;
        const [dx, dy] = AROUND[g.i];
        place = [at[0] + dx + 14 * Math.sin(1.3 * t + g.i), at[1] + dy + 14 * Math.cos(1.7 * t + 2 * g.i)];
      }
      const target = g.layer === home ? place : [side(g.p[0]), g.p[1]]; // off the side first, to change over unseen
      perch &&= phase !== 'away' && g.layer === home;

      if (g.perched && perch) g.p = target; // it stays on its perch as the twig or the button moves
      else {
        if (!perch && g.layer === stage) g.p[1] -= sweep;
        if (perch && g.last) g.p = g.p.map((v, k) => v + target[k] - g.last[k]); // and moves with it while landing
        for (const k of [0, 1]) {
          g.v[k] += (26 * (target[k] - g.p[k]) - (perch ? 10.2 : 8) * g.v[k]) * dt; // it lands without overshooting
          g.p[k] += g.v[k] * dt;
        }
        g.perched = perch && Math.hypot(target[0] - g.p[0], target[1] - g.p[1]) < 3 && Math.hypot(...g.v) < 40;
      }
      g.last = perch && target;
      if (g.slow !== g.perched) g.el.style.setProperty('--f', (g.slow = g.perched) ? '1.4s' : g.f); // wings slowly opening and closing
      const off = g.p[0] < -g.s / 2 || g.p[0] > W + g.s / 2;
      if (off && g.layer !== home) { // changes over, and comes back in level with its place, so it crosses no words
        home.append(g.el);
        g.layer = home;
        g.v = [0, 0];
        g.last = null;
        g.p = [side(place[0]), place[1]];
      }
      busy ||= !(g.perched || (off && (phase === 'away' || g.layer !== home)));
      const grow = Math.min(1, (now - g.born) / 350);
      g.el.style.visibility = off ? 'hidden' : '';
      g.el.style.transform = `translate(${g.p[0] - g.s / 2}px, ${g.p[1] - g.h / 2}px) rotate(${g.perched ? g.tilt : Math.max(-28, Math.min(28, g.v[0] / 30))}deg) scale(${0.3 + 0.7 * grow * (2 - grow)})`;
    }
    if (busy) wake();
  }
  const wake = () => raf || (raf = requestAnimationFrame(frame));

  const onDown = e => (down = { x: e.clientX, y: e.clientY, at: e.timeStamp });
  const onUp = e => {
    if (down && e.timeStamp - down.at < 350 && Math.hypot(e.clientX - down.x, e.clientY - down.y) < 10 && !e.target.closest('a, button')) release(e.clientX, e.clientY);
  };
  const onScroll = () => {
    if (!guests.length) release(...(down && performance.now() - down.at < 1500 ? [down.x, down.y] : [innerWidth / 2, 0.8 * innerHeight]));
    wake();
  };
  addEventListener('pointerdown', onDown, { passive: true });
  addEventListener('pointerup', onUp, { passive: true });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', wake, { passive: true });
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('pointerdown', onDown);
    removeEventListener('pointerup', onUp);
    removeEventListener('scroll', onScroll);
    removeEventListener('resize', wake);
    for (const g of guests) g.el.remove();
  };
}
