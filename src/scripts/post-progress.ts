// Reading progress bar (top of viewport) + TOC scroll-spy.
// Both only activate when a .post-body element exists on the page.

function setupProgress() {
  const bar = document.querySelector<HTMLElement>('.read-progress');
  const body = document.querySelector<HTMLElement>('.post-body');
  if (!bar || !body) return;

  function update() {
    const rect = body!.getBoundingClientRect();
    const total = rect.height - window.innerHeight + 200;
    const scrolled = Math.max(0, -rect.top);
    const pct = total > 0 ? Math.min(1, scrolled / total) : 0;
    bar!.style.transform = `scaleX(${pct})`;
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
  window.addEventListener('resize', update);
}

function setupTocSpy() {
  const toc = document.querySelector<HTMLElement>('.toc');
  if (!toc) return;
  const links = toc.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
  if (links.length === 0) return;

  const linkByHash = new Map<string, HTMLAnchorElement>();
  const headings: HTMLElement[] = [];
  links.forEach((a) => {
    const id = decodeURIComponent(a.hash.slice(1));
    const h = document.getElementById(id);
    if (h) {
      headings.push(h);
      linkByHash.set(id, a);
    }
  });
  if (headings.length === 0) return;

  let activeId: string | null = null;
  function setActive(id: string | null) {
    if (id === activeId) return;
    activeId = id;
    links.forEach((a) => a.classList.remove('is-active'));
    if (id) linkByHash.get(id)?.classList.add('is-active');
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .map((e) => ({ id: (e.target as HTMLElement).id, top: e.boundingClientRect.top }))
        .sort((a, b) => a.top - b.top);
      if (visible.length > 0) {
        setActive(visible[0].id);
      }
    },
    { rootMargin: '-80px 0px -60% 0px', threshold: 0 },
  );

  headings.forEach((h) => observer.observe(h));
}

function init() {
  setupProgress();
  setupTocSpy();
}

document.addEventListener('astro:page-load', init);
