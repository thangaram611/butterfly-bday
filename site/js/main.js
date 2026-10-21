import { film } from './scenes.js';
import { flock } from './butterflies.js';
import { invite } from './invite.js';

const root = document.documentElement;

// ?to=Ravi%20Uncle%20%26%20family → "Dear Ravi Uncle & family," (textContent only, so a name is never HTML)
const name = new URLSearchParams(location.search).get('to')?.trim().slice(0, 40);
if (name) {
  const greet = document.querySelector('.greet');
  greet.querySelector('span').textContent = name;
  greet.hidden = false;
}
invite(name);

// The rest of the film's art loads once the first screen has (or as soon as the guest starts scrolling)
const loadRest = () => root.classList.add('loaded');
addEventListener('load', loadRest, { once: true });
addEventListener('scroll', loadRest, { once: true, passive: true });

const { gsap, ScrollTrigger } = window;
if (!gsap || !ScrollTrigger) root.classList.remove('anim');
else {
  gsap.registerPlugin(ScrollTrigger);
  // Everything that moves exists only while motion is allowed; matchMedia reverts it all if that changes.
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    root.classList.add('anim');
    ScrollTrigger.refresh();
    film();
    const stopFlock = flock();
    return () => {
      stopFlock();
      root.classList.remove('anim');
    };
  });
}
