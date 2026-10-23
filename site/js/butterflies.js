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

// The garden's butterflies, the signature move (BRIEF.md). At dawn they play over the meadow, each its own wandering,
// bobbing way, now and then resting on a daisy or whirling round another. Once the guest scrolls, the few nearest the
// caterpillar come along, wherever guide() (js/story.js) wants them: round the caterpillar, on the twig, with the new
// butterfly down to her, away for the details, then on the edges of "Tell us you're coming". Scrolled back, the story
// plays backwards and they go with it; at the top they rejoin the others. A touch, or the mouse, startles the ones
// near it: they dart off, then come back.
//
// Those that came along are springs towards their places, so they lag a little, overshoot and catch up, and the world
// sweeps them along as the thumb flicks. They fly in three layers, each in its own px: the garden's, among its flowers
// (the near ones pass in front of them); the stage's, in front of the caterpillar and the twig; and the close's, so it
// carries them as it scrolls. They change layer only where it can't show: off the screen or behind the evening garden,
// or (between the garden's and the stage's, which share their px) clear of the near flowers and the caterpillar.
const COUNT = { play: [10, 14], along: [5, 7] }; // on a phone, and on a wider screen
// round the caterpillar or the new butterfly, in px: either side of it and along it
const AROUND = [[-70, -40], [75, 10], [-60, 60], [70, -70], [-95, -5], [95, 55], [-40, -100]];
// on the button: along its top (-1) or bottom (1) edge, or on its round ends (0), clear of its words
const SPOTS = [[0.16, -1], [0.84, -1], [0, 0], [1, 0], [0.5, 1], [0.2, 1], [0.8, 1]];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

export function friends(guide) {
  const garden = document.querySelector('.world .friends'), stage = document.querySelector('.stage > .friends'), close = document.querySelector('.close .friends');
  const button = document.querySelector('.coming');
  const wide = innerWidth >= 768, flock = [];
  let raf = 0, last = 0, cam, lift, spot, along = false;

  // one after another they rise out of the flowers below the screen into the garden
  const z0 = guide().garden;
  for (let i = 0; i < COUNT.play[+wide]; i++) {
    const s = rand(29, 37), h = (s * 779) / 1024, el = document.createElement('div'); // the garden is drawn about as big on any screen
    el.className = 'bf friend';
    el.style.setProperty('--img', `url(${new URL(SPRITES[i % SPRITES.length], location.href)})`);
    el.style.setProperty('--s', `${s}px`);
    el.style.visibility = 'hidden';
    el.innerHTML = '<i class="l"></i><i class="r"></i>';
    garden.append(el);
    flock.push({
      el, s, h, f: rand(0.15, 0.24), tilt: rand(-12, 12), bob: rand(0, 6), cruise: rand(55, 95),
      wobble: [rand(1.2, 2.6), rand(0, 6), rand(3.5, 6), rand(0, 6)],
      layer: garden, mode: 'play', p: [rand(z0.left + s / 2, z0.right - s / 2), innerHeight + h], v: [rand(-40, 40), -rand(200, 280)],
      hold: performance.now() + rand(0, 1200), until: 0, calm: 0, daisy: -1, rest: 0, pair: null,
    });
  }

  // A playing one's next aim: mostly somewhere nearby in the open air, sometimes a free daisy to rest on, or another
  // one close by to whirl round; and now and then it goes there slowly, gliding on slow beats. Aims are in the meadow's
  // px, so they travel with it.
  function pick(g, z, now) {
    g.until = now + rand(1800, 4500);
    g.daisy = -1;
    g.pace = Math.random() < 0.25 ? 0.6 : rand(0.85, 1.2);
    const r = Math.random();
    if (r < 0.15) {
      const free = z.daisies.flatMap(([x], i) => (x > z.left + g.s / 2 && x < z.right - g.s / 2 && !flock.some(o => o.daisy === i) ? [i] : []));
      if (free.length) return (g.daisy = free[Math.floor(Math.random() * free.length)]);
    }
    if (r > 0.85 && g.layer === garden) {
      const mate = flock.find(o => o !== g && o.mode === 'play' && o.layer === garden && !o.pair && o.daisy < 0 && dist(o.p, g.p) < 160);
      if (mate) {
        const c = [(g.p[0] + mate.p[0]) / 2, (g.p[1] + mate.p[1]) / 2 + z.lift];
        g.pair = mate.pair = { a: g, b: mate, c, th: rand(0, 6), dir: Math.random() < 0.5 ? -1 : 1, until: now + rand(2000, 3500),
          wp: [clamp(c[0] + rand(-100, 100), z.left + 30, z.right - 30), clamp(c[1] - rand(20, 90), z.top + 30, z.bottom)] }; // spiralling up
        g.until = mate.until = g.pair.until;
        return;
      }
    }
    const [x, y] = [g.p[0], g.p[1] + z.lift], near = Math.random() < 0.5;
    g.wp = [clamp(near ? x + rand(-160, 160) : rand(z.left, z.right), z.left + g.s / 2, z.right - g.s / 2),
      clamp(near ? y + rand(-140, 120) : rand(z.top, z.bottom), z.top + g.h / 2, z.bottom)];
  }
  function unpair(g, z, now) {
    if (!g.pair) return;
    const { a, b } = g.pair;
    a.pair = b.pair = null;
    pick(a === g ? b : a, z, now);
  }

  // where a playing one is headed, on the screen: the daisy it's landing on, its side of the whirl, or its aim
  function aim(g, z, now, dt) {
    if (g.rest && now > g.rest) { // it takes off again
      g.rest = 0;
      g.v = [rand(-50, 50), -rand(90, 140)];
      pick(g, z, now);
    }
    if (g.pair && now > g.pair.until) unpair(g, z, now);
    if (!g.rest && now > g.until) pick(g, z, now);
    if (g.daisy >= 0) { const [x, y] = z.daisies[g.daisy]; return [x, y - z.lift - g.h / 2 + 3]; } // standing on it
    if (g.pair) {
      const pr = g.pair, r = pr.a === g ? 1 : -1;
      if (r > 0) { // once a frame, for the two
        pr.th += pr.dir * 7 * dt;
        const d = dist(pr.wp, pr.c), step = Math.min(d, 45 * dt);
        if (d) pr.c = pr.c.map((v, k) => v + ((pr.wp[k] - v) * step) / d);
      }
      return [pr.c[0] + r * 18 * Math.cos(pr.th), pr.c[1] - z.lift + r * 14 * Math.sin(pr.th)];
    }
    return [g.wp[0], g.wp[1] - z.lift];
  }

  // a playing one's flight: it steers for its aim at its own pace, pushed this way and that by an uneven flutter of
  // its own (less while it's still on its way back to the garden), keeping a little room from the others, inside the
  // open air and never up into the title
  function flit(g, z, target, dt, t, now) {
    if (g.rest) return (g.p = target); // resting on its daisy, which moves with the meadow
    const home = g.layer === garden, dx = target[0] - g.p[0], dy = target[1] - g.p[1], d = Math.hypot(dx, dy) || 1, landing = (g.landing = g.daisy >= 0 && home);
    if (landing && d < 4) {
      g.p = target;
      g.v = [0, 0];
      g.rest = now + rand(2500, 6000);
      return;
    }
    if (!landing && !g.pair && d < 24) pick(g, z, now);
    const want = landing ? Math.min(g.cruise, 2.5 * d) : g.pair ? Math.min(2.4 * g.cruise, 6 * d) : g.cruise * g.pace, grip = g.pair ? 6 : 2.2;
    let ax = ((dx / d) * want - g.v[0]) * grip, ay = ((dy / d) * want - g.v[1]) * grip;
    if (!landing || d > 40) {
      const n = (Math.sin(g.wobble[0] * t + g.wobble[1]) + 0.6 * Math.sin(g.wobble[2] * t + g.wobble[3])) * (home ? 1 : 0.4), sp = Math.hypot(...g.v) || 1;
      ax -= (g.v[1] / sp) * n * 260;
      ay += (g.v[0] / sp) * n * 260;
      for (const o of flock) {
        const e = dist(g.p, o.p);
        if (o === g || o.layer !== g.layer || e >= 40 || !e || (g.pair && g.pair === o.pair)) continue;
        ax += ((g.p[0] - o.p[0]) / e) * (40 - e) * 30;
        ay += ((g.p[1] - o.p[1]) / e) * (40 - e) * 30;
      }
    }
    const top = z.top - z.lift + g.h / 2, bottom = z.bottom - z.lift, left = z.left + g.s / 2, right = z.right - g.s / 2;
    ax += clamp((left - g.p[0]) * 20, 0, 500) - clamp((g.p[0] - right) * 20, 0, 500);
    ay += clamp((top + 24 - g.p[1]) * 20, 0, 500) - clamp((g.p[1] - bottom) * 20, 0, 500);
    g.v[0] += ax * dt;
    g.v[1] += ay * dt;
    const sp = Math.hypot(...g.v), max = 3 * g.cruise;
    if (sp > max) g.v = g.v.map(v => (v * max) / sp);
    g.p[0] += g.v[0] * dt;
    g.p[1] += g.v[1] * dt;
    if (g.p[1] < top) { // the title's edge
      g.p[1] = top;
      g.v[1] = Math.abs(g.v[1]) / 2;
    }
  }

  // Between the garden's layer and the stage's, a butterfly changes over unseen where neither paints over it: clear of
  // the near flowers' box (in front of the garden's) and of the caterpillar (behind the stage's). Inside the box, it
  // first rises out of it.
  const among = (g, n) => g.p[0] + g.s / 2 > n.left && g.p[0] - g.s / 2 < n.right && g.p[1] + g.h / 2 > n.top && g.p[1] - g.h / 2 < n.bottom;
  const clear = (g, G) => !among(g, G.garden.near) && G.body.every(q => dist(g.p, q) > G.reach + g.s / 2);
  const rise = (g, n) => [g.p[0], n.top - g.h / 2 - 12];

  function frame(now) {
    raf = 0;
    const dt = Math.min(0.05, (now - last) / 1000), t = now / 1000;
    last = now;
    const G = guide(), { phase, garden: z } = G, W = innerWidth;
    const sweep = cam === undefined ? 0 : clamp(0.5 * (G.cam - cam), -60, 60); // the world carries those that came along a little
    const carry = lift === undefined ? 0 : z.lift - lift; // and those in the garden exactly as far as the meadow
    cam = G.cam;
    lift = z.lift;
    stage.style.zIndex = phase === 'vine' ? 4 : 7; // behind the vine's paper tags; in front of the twig and of her
    // the guest scrolls: the few nearest the caterpillar come along. Back at the top, they rejoin the others
    if (!along && G.screens > 0.04) {
      along = true;
      flock.slice().sort((a, b) => dist(a.p, G.body[3]) - dist(b.p, G.body[3])).slice(0, COUNT.along[+wide]).forEach((g, k) => {
        unpair(g, z, now);
        Object.assign(g, { mode: 'along', k, daisy: -1, rest: 0, perched: false, last: null });
      });
    } else if (along && G.screens < 0.01) {
      along = false;
      for (const g of flock) if (g.mode === 'along') {
        g.mode = 'play';
        g.perched = false;
        pick(g, z, now);
        g.pace = 1.3; // hurrying home
      }
    }
    let b, busy = false;
    if (phase === 'close') { // the button, in the close's px; it rises a little as the close comes in
      const r = button.getBoundingClientRect(), o = close.getBoundingClientRect();
      b = { left: r.left - o.left, top: r.top - o.top, width: r.width, height: r.height };
      busy = spot !== (spot = `${b.left} ${b.top}`);
    }
    const boxes = new Map([garden, stage, close].map(l => [l, l.getBoundingClientRect()]));
    const awake = z.bottom - z.lift > -100; // the garden is in view (or nearly)
    for (const g of flock) {
      if (now < g.hold) { // still waiting to flutter in
        busy = true;
        continue;
      }
      const home = g.mode === 'play' ? garden : phase === 'close' ? close : stage, shared = g.layer !== close && home !== close;
      const side = x => (x < W / 2 ? -g.s : W + g.s); // off the nearer side
      if (g.mode === 'play' || g.layer === garden) g.p[1] -= carry;
      let place;
      if (g.mode === 'play') {
        if (!awake && g.layer === garden) { // the garden has scrolled away: it waits there, out of sight
          g.el.style.visibility = 'hidden';
          continue;
        }
        place = aim(g, z, now, dt);
        flit(g, z, g.layer === stage && among(g, z.near) ? rise(g, z.near) : place, dt, t, now);
        busy = true;
      } else {
        let perch = true;
        if (phase === 'twig') place = [G.perches[g.k][0], G.perches[g.k][1] - g.h / 2 + 4]; // standing on it
        else if (phase === 'close') {
          const [fx, edge] = SPOTS[g.k];
          const end = 23 - g.s / 2; // 4 px short of its words (they start 27 px in)
          place = [b.left + (fx === 0 ? end : fx === 1 ? b.width - end : fx * b.width), b.top + (edge < 0 ? 11 - g.h / 2 : edge > 0 ? b.height - 11 + g.h / 2 : b.height / 2)];
        } else if (phase === 'away') place = [side(g.p[0]), g.p[1]];
        else {
          perch = false;
          const [dx, dy] = AROUND[g.k];
          place = [G.at[0] + dx + 14 * Math.sin(1.3 * t + g.k), G.at[1] + dy + 14 * Math.cos(1.7 * t + 2 * g.k)];
        }
        const target = g.layer === home ? place : !shared ? [side(g.p[0]), g.p[1]] : among(g, z.near) ? rise(g, z.near) : place; // off the side first, to change over unseen
        perch &&= phase !== 'away' && g.layer === home && now > g.calm;
        g.landing = perch;

        if (g.perched && perch) g.p = target; // it stays on its perch as the twig or the button moves
        else {
          if (!perch && g.layer === stage) g.p[1] -= sweep;
          if (perch && g.last) g.p = g.p.map((v, k) => v + target[k] - g.last[k]); // and moves with it while landing
          for (const k of [0, 1]) g.v[k] += (26 * (target[k] - g.p[k]) - (perch ? 10.2 : 8) * g.v[k]) * dt; // it lands without overshooting
          const sp = Math.hypot(...g.v);
          if (sp > 700) g.v = g.v.map(v => (v * 700) / sp); // however far it has to go
          for (const k of [0, 1]) g.p[k] += g.v[k] * dt;
          g.perched = perch && dist(target, g.p) < 3 && Math.hypot(...g.v) < 40;
        }
        g.last = perch && target;
      }
      const o = boxes.get(g.layer), x = g.p[0] + o.left, y = g.p[1] + o.top;
      const off = x < -g.s / 2 || x > W + g.s / 2 || y < -g.h || y > innerHeight + g.h || (g.layer === stage && G.covered);
      if (g.layer !== home && (off || (shared && clear(g, G)))) {
        home.append(g.el);
        g.layer = home;
        if (off) { // comes back in level with its place, so it crosses no words
          g.v = [0, 0];
          g.last = null;
          g.p = [side(place[0]), place[1]];
        }
      }
      busy ||= !(g.perched || (off && (phase === 'away' || g.layer !== home)));
      const still = g.perched || g.rest, flap = still ? 1.4 : g.mode === 'play' && g.pace < 0.7 ? 2.5 * g.f : g.f; // wings slowly opening and closing
      if (g.flap !== flap) g.el.style.setProperty('--f', `${(g.flap = flap)}s`);
      g.el.style.visibility = off ? 'hidden' : '';
      // in free flight it banks into its turns and rises a little with each beat; landing or resting, it's level
      const free = !(still || g.landing), tilt = free ? clamp(g.v[0] / (g.mode === 'play' ? 12 : 30), -28, 28) : g.tilt;
      const bob = free ? 2.5 * Math.sin((t * Math.PI) / g.f + g.bob) : 0;
      // and never over the title: its turned box keeps 6 px below the letters
      const a = (tilt * Math.PI) / 180, half = (g.s * Math.abs(Math.sin(a)) + g.h * Math.cos(a)) / 2;
      if (g.layer !== close && g.p[1] + bob - half < G.title + 6) {
        g.p[1] = G.title + 6 + half - bob;
        g.v[1] = Math.max(0, g.v[1]);
      }
      g.el.style.transform = `translate(${g.p[0] - g.s / 2}px, ${g.p[1] - g.h / 2 + bob}px) rotate(${tilt}deg)`;
    }
    if (busy) wake();
  }
  const wake = () => raf || (raf = requestAnimationFrame(frame));

  // a touch (or the mouse) startles the ones near it: they dart away from it, and those playing find somewhere else
  function startle(x, y) {
    const now = performance.now(), boxes = new Map([garden, stage, close].map(l => [l, l.getBoundingClientRect()]));
    let z;
    for (const g of flock) {
      const o = boxes.get(g.layer), dx = g.p[0] + o.left - x, dy = g.p[1] + o.top - y, d = Math.hypot(dx, dy) || 1;
      if (d > 70 + g.s / 2 || now < g.calm || now < g.hold) continue;
      g.calm = now + 900; // it flutters about a while before it settles again
      const k = rand(240, 340) / d;
      g.v = [g.v[0] + dx * k, g.v[1] + dy * k - 60];
      g.perched = false;
      if (g.mode === 'play') {
        z ??= guide().garden;
        unpair(g, z, now);
        g.rest = 0;
        g.daisy = -1;
        g.wp = [clamp(g.p[0] + (dx / d) * 150, z.left + g.s / 2, z.right - g.s / 2), clamp(g.p[1] + z.lift + (dy / d) * 150, z.top + g.h / 2, z.bottom)];
        g.until = now + rand(1200, 2500);
      }
    }
    wake();
  }
  const onDown = e => startle(e.clientX, e.clientY);
  const onMove = e => e.pointerType === 'mouse' && startle(e.clientX, e.clientY);
  addEventListener('pointerdown', onDown, { passive: true });
  addEventListener('pointermove', onMove, { passive: true });
  addEventListener('scroll', wake, { passive: true });
  addEventListener('resize', wake, { passive: true });
  wake();
  return () => {
    cancelAnimationFrame(raf);
    removeEventListener('pointerdown', onDown);
    removeEventListener('pointermove', onMove);
    removeEventListener('scroll', wake);
    removeEventListener('resize', wake);
    for (const g of flock) g.el.remove();
  };
}
