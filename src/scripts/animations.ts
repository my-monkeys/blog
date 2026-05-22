import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function staggerHero() {
  const hero = document.querySelector<HTMLElement>('.hero-display');
  if (!hero) return;
  const text = hero.textContent ?? '';
  hero.textContent = '';
  for (const ch of text) {
    const span = document.createElement('span');
    span.textContent = ch === ' ' ? ' ' : ch;
    span.style.display = 'inline-block';
    span.style.willChange = 'transform, opacity';
    hero.appendChild(span);
  }
  gsap.from('.hero-display span', {
    y: 30,
    opacity: 0,
    duration: 0.5,
    ease: 'power2.out',
    stagger: 0.06,
  });
}

function scrollInRows() {
  const rows = gsap.utils.toArray<HTMLElement>('.row, .featured');
  rows.forEach((el) => {
    gsap.from(el, {
      y: 20,
      opacity: 0,
      duration: 0.5,
      ease: 'power2.out',
      scrollTrigger: { trigger: el, start: 'top 85%' },
    });
  });
}

function init() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  staggerHero();
  scrollInRows();
}

// Run on first load AND on Astro View Transitions (page navigation).
document.addEventListener('astro:page-load', init);
