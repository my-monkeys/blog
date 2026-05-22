import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import pagefind from 'astro-pagefind';

export default defineConfig({
  site: 'https://blog.my-monkey.fr',
  trailingSlash: 'never',
  build: {
    format: 'directory',
  },
  integrations: [
    expressiveCode({
      themes: ['github-light', 'github-dark-dimmed'],
      themeCssSelector: (theme) => `[data-theme='${theme.type}']`,
      styleOverrides: {
        borderRadius: '0',
        borderWidth: '2px',
        codeFontFamily: 'JetBrains Mono, ui-monospace, monospace',
      },
    }),
    mdx(),
    sitemap(),
    pagefind(),
  ],
  vite: {
    ssr: {
      noExternal: ['gsap'],
    },
  },
});
