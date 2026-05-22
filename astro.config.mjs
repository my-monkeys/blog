import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import expressiveCode from 'astro-expressive-code';
import pagefind from 'astro-pagefind';
import AstroPWA from '@vite-pwa/astro';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default defineConfig({
  site: 'https://blog.my-monkey.fr',
  trailingSlash: 'always',
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
    mdx({
      remarkPlugins: [remarkMath],
      rehypePlugins: [rehypeKatex],
    }),
    sitemap(),
    pagefind(),
    AstroPWA({
      registerType: 'autoUpdate',
      injectRegister: 'inline',
      manifest: false, // we ship our own public/manifest.webmanifest
      includeManifestIcons: false,
      workbox: {
        // Pre-cache the shell (HTML, CSS, JS, fonts, small assets).
        // Skip OG images and pagefind index (handled at runtime if needed).
        globPatterns: ['**/*.{html,js,css,svg,woff2,webmanifest,ico}'],
        globIgnores: ['**/og/**', '**/pagefind/**', '**/admin/**'],
        navigateFallback: '/offline/',
        navigateFallbackDenylist: [
          /^\/admin/,
          /^\/_astro/,
          /^\/pagefind/,
          /^\/api/,
          /\.[a-z0-9]+$/i, // any file with an extension (assets)
        ],
        // 5 MB max per file (avoid choking on big SVGs)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        runtimeCaching: [
          {
            // Visited pages: NetworkFirst — fresh content when online,
            // fallback to cache when offline.
            urlPattern: ({ request }) => request.mode === 'navigate',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'pages',
              networkTimeoutSeconds: 3,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Images (OG, covers, inline) — CacheFirst, long TTL.
            urlPattern: /\.(?:png|jpe?g|webp|avif|gif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
        cleanupOutdatedCaches: true,
      },
      devOptions: { enabled: false },
    }),
  ],
  vite: {
    ssr: {
      noExternal: ['gsap'],
    },
  },
});
