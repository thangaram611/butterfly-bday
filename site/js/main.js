import { flock, friends } from './butterflies.js';
import { invite } from './invite.js';
import { story } from './story.js';

const { ScrollCraft, gsap } = window;

// ?to=Ravi%20Uncle%20%26%20family → "Dear Ravi Uncle & family," (textContent only, so a name is never HTML). Kept on
// this phone, so the invite opened from the home screen, which knows only the plain address, still greets them.
let name = new URLSearchParams(location.search).get('to')?.trim().slice(0, 40);
try {
  if (name) localStorage.setItem('to', name);
  else name = localStorage.getItem('to') ?? undefined;
} catch {}
if (name) {
  const greet = document.querySelector('.greet');
  greet.querySelector('span').textContent = name;
  greet.hidden = false;
}
invite(name);

// Offline after one visit (sw.js). The worker doesn't serve the visit that installs it, so the page hands it the list
// of what it has loaded, once it's ready and again whenever the guest leaves (the pictures further down load later).
// Guests are never asked to install the invite; they can add it to their home screen from the browser's menu.
addEventListener('beforeinstallprompt', e => e.preventDefault());
if ('serviceWorker' in navigator) {
  const loaded = () => [location.href, ...performance.getEntriesByType('resource').map(r => r.name)];
  navigator.serviceWorker.register('sw.js');
  navigator.serviceWorker.ready.then(({ active }) => {
    active.postMessage(loaded());
    addEventListener('visibilitychange', () => document.hidden && active.postMessage(loaded()));
  });
}

// The scroll-craft engine reveals the details and the close as they arrive (data-sc-in); the story is our own GSAP
// timeline (js/story.js), played by the scroll once per frame.
ScrollCraft.mount(document.body);
const { play, guide } = story();
let queued = false;
const update = () => {
  queued = false;
  play();
};
const schedule = () => queued || ((queued = true), requestAnimationFrame(update));
addEventListener('scroll', schedule, { passive: true });
addEventListener('resize', schedule, { passive: true });
addEventListener('load', schedule, { once: true });
update();

gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
  const stops = [flock(), friends(guide)];
  return () => stops.forEach(stop => stop());
});
