import { getCollection } from 'astro:content';
import type { APIContext } from 'astro';
import satori from 'satori';
import { html } from 'satori-html';
import { Resvg } from '@resvg/resvg-js';

export async function getStaticPaths() {
  const posts = await getCollection('posts', ({ data }) => !data.draft && data.type !== 'link');
  return posts.map((post) => ({
    params: { slug: post.slug },
    props: { post },
  }));
}

async function loadFont() {
  const url = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@700&display=swap';
  // satori needs the raw .ttf/.otf; for static OG, fetch the font binary directly.
  const cssRes = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  const css = await cssRes.text();
  const m = css.match(/url\((https:[^)]+\.ttf)\)/);
  if (!m) throw new Error('Could not resolve Space Grotesk TTF URL');
  const fontRes = await fetch(m[1]);
  return new Uint8Array(await fontRes.arrayBuffer());
}

const FONT = await loadFont();

export async function GET({ props }: APIContext) {
  const { post } = props as { post: Awaited<ReturnType<typeof getCollection<'posts'>>>[number] };
  const d = post.data;
  const dateStr = d.date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

  const markup = html`
    <div style="display:flex;flex-direction:column;width:100%;height:100%;background:#FFFBEB;color:#1E1E1E;padding:80px;font-family:Space Grotesk;border:12px solid #1E1E1E;box-sizing:border-box;">
      <div style="font-size:28px;letter-spacing:6px;text-transform:uppercase;color:#4A4A4A;">
        ${dateStr} · ${d.type.toUpperCase()}${d.project ? ` · ${d.project}` : ''}
      </div>
      <div style="display:flex;font-size:88px;font-weight:700;line-height:1.05;margin-top:40px;flex:1;">
        ${d.title}
      </div>
      <div style="display:flex;justify-content:space-between;align-items:center;font-size:26px;color:#FF6B35;font-weight:700;letter-spacing:4px;text-transform:uppercase;">
        <span>BLOG.MY-MONKEY.FR</span>
        <span>→</span>
      </div>
    </div>
  `;

  const svg = await satori(markup as any, {
    width: 1200,
    height: 630,
    fonts: [{ name: 'Space Grotesk', data: FONT, weight: 700, style: 'normal' }],
  });

  const png = new Resvg(svg).render().asPng();
  return new Response(png, { headers: { 'Content-Type': 'image/png' } });
}
