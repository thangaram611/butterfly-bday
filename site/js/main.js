import { flock } from './butterflies.js';
import { garden } from './garden.js';
import { invite } from './invite.js';
import { peak } from './peak.js';

const { ScrollCraft, gsap } = window;

// ?to=Ravi%20Uncle%20%26%20family → "Dear Ravi Uncle & family," (textContent only, so a name is never HTML)
const name = new URLSearchParams(location.search).get('to')?.trim().slice(0, 40);
if (name) {
  const greet = document.querySelector('.greet');
  greet.querySelector('span').textContent = name;
  greet.hidden = false;
}
invite(name);

// The scroll-craft engine drives every data-sc-* attribute on the page: the peak's pin and frame sequence, its iris,
// the cues and the reveals. Our own moments run on GSAP, read once per frame after the engine's own read (its scroll
// listener was added first, so its frame callback runs first).
const sc = ScrollCraft.mount(document.body);
const moments = [garden(), peak(sc)];
let queued = false;
const update = () => {
  queued = false;
  for (const m of moments) m();
};
const schedule = () => queued || ((queued = true), requestAnimationFrame(update));
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule, { passive: true });
addEventListener('load', schedule, { once: true });
update();

gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => flock());
