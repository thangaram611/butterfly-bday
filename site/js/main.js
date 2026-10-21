import { scenes } from './scenes.js';
import { flock } from './butterflies.js';
import { invite } from './invite.js';

// ?to=Ravi%20Uncle%20%26%20family → "Dear Ravi Uncle & family," (textContent only, so a name is never HTML)
const name = new URLSearchParams(location.search).get('to')?.trim().slice(0, 40);
if (name) {
  const greet = document.querySelector('.greet');
  greet.querySelector('span').textContent = name;
  greet.hidden = false;
}
invite(name);

// Scene 4's art starts loading once scene 2 is on screen
new IntersectionObserver(([entry], io) => {
  if (!entry.isIntersecting) return;
  document.querySelectorAll('.s4 img[loading=lazy]').forEach(img => (img.loading = 'eager'));
  io.disconnect();
}).observe(document.querySelector('.s2'));

const { gsap, ScrollTrigger } = window;
if (gsap && ScrollTrigger) {
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });
  // Everything that moves exists only while motion is allowed; matchMedia reverts it all if that changes.
  gsap.matchMedia().add('(prefers-reduced-motion: no-preference)', () => {
    document.documentElement.classList.add('anim');
    ScrollTrigger.refresh();
    scenes();
    const stopFlock = flock();
    return () => {
      stopFlock();
      document.documentElement.classList.remove('anim');
    };
  });
}
