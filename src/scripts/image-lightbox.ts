// Click-to-zoom for post images. Targets .post img (cover + inline body).
// Uses a native <dialog> created lazily on first open.

function ensureDialog(): HTMLDialogElement {
  let dlg = document.getElementById('image-dialog') as HTMLDialogElement | null;
  if (dlg) return dlg;
  dlg = document.createElement('dialog');
  dlg.id = 'image-dialog';
  dlg.className = 'image-dialog';
  dlg.innerHTML = `
    <button class="image-dialog-close" type="button" aria-label="Fermer">&times;</button>
    <div class="image-dialog-content"></div>
  `;
  document.body.appendChild(dlg);
  dlg.addEventListener('click', (e) => {
    if (e.target === dlg) dlg!.close();
  });
  dlg.querySelector('.image-dialog-close')?.addEventListener('click', () => dlg!.close());
  return dlg;
}

// Pick the highest-resolution variant from srcset, fall back to currentSrc/src.
function getLargestSrc(img: HTMLImageElement): string {
  if (img.srcset) {
    const candidates = img.srcset.split(',').map((s) => {
      const parts = s.trim().split(/\s+/);
      const url = parts[0] ?? '';
      const w = parts[1] ? parseInt(parts[1], 10) : 0;
      return { url, w };
    });
    candidates.sort((a, b) => b.w - a.w);
    if (candidates[0]?.url) return candidates[0].url;
  }
  return img.currentSrc || img.src;
}

function openImage(src: string, alt: string) {
  const dlg = ensureDialog();
  const content = dlg.querySelector<HTMLElement>('.image-dialog-content');
  if (!content) return;
  content.innerHTML = '';
  const img = document.createElement('img');
  img.src = src;
  img.alt = alt;
  content.appendChild(img);
  document.body.style.overflow = 'hidden';
  dlg.showModal();
  dlg.addEventListener('close', () => { document.body.style.overflow = ''; }, { once: true });
}

function attach() {
  const imgs = document.querySelectorAll<HTMLImageElement>(
    '.post img:not([data-zoomable]):not([data-no-zoom])',
  );
  for (const img of imgs) {
    img.dataset.zoomable = '1';
    img.style.cursor = 'zoom-in';
    img.addEventListener('click', () => {
      openImage(getLargestSrc(img), img.alt || '');
    });
  }
}

document.addEventListener('astro:page-load', attach);
