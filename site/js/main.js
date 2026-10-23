import { flock, friends } from './butterflies.js';
import { invite } from './invite.js';
import { story } from './story.js';

const { ScrollCraft, gsap } = window;

// ?to=Ravi%20Uncle%20%26%20family → "Dear Ravi Uncle & family," (textContent only, so a name is never HTML)
const name = new URLSearchParams(location.search).get('to')?.trim().slice(0, 40);
if (name) {
  const greet = document.querySelector('.greet');
  greet.querySelector('span').textContent = name;
  greet.hidden = false;
}
invite(name);

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
