// next.config.mjs

// Importa 'withPWA' usando la sintassi ES Module
import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Le tue configurazioni Next.js esistenti
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Aggiungi qui altre tue configurazioni se ne avessi in futuro
};

// --- Inizio configurazione next-pwa ---
const pwaConfig = withPWA({
  dest: 'public', // Questo dice a next-pwa dove mettere i file generati (manifest, sw.js)
  register: true, // Questo farà sì che next-pwa registri automaticamente il service worker
  skipWaiting: true, // Il nuovo service worker prenderà il controllo immediatamente
  disable: process.env.NODE_ENV === 'development', // Disabilita la PWA in sviluppo

  // Aggiungi questa sezione per configurare Workbox (il motore di next-pwa)
  workboxOptions: {
    // Queste sono le rotte che verranno precacheate automaticamente
    runtimeCaching: [
      {
        urlPattern: /^https?.*/, // Corrisponde a tutte le richieste HTTP/HTTPS
        handler: 'NetworkFirst', // Prova prima la rete, poi la cache
        options: {
          cacheName: 'next-pwa-cache',
          expiration: {
            maxEntries: 100,
            maxAgeSeconds: 30 * 24 * 60 * 60, // 30 giorni
          },
          cacheableResponse: {
            statuses: [0, 200],
          },
        },
      },
    ],
    // Aggiungi qui le pagine specifiche che vuoi precachare all'installazione
    // Questo è fondamentale per l'offline immediato
    precacheManifest: [
      { url: '/', revision: null }, // La tua homepage
      { url: '/manifest.json', revision: null }, // Il manifest
      { url: '/android-chrome-192x192.png', revision: null }, // Icona 192x192
      { url: '/android-chrome-512x512.png', revision: null }, // Icona 512x512
      // Aggiungi qui altre pagine e asset critici (es. CSS, JS chunks)
      // { url: '/_next/static/css/globals.css', revision: null },
      // { url: '/_next/static/chunks/pages/_app.js', revision: null },
    ].concat(self.__WB_MANIFEST || []), // Concatena con il manifest generato automaticamente
  },
});

// Esporta la configurazione di Next.js avvolta da withPWA usando export default
export default pwaConfig(nextConfig);
// --- Fine configurazione next-pwa ---
// Esporta la configurazione di Next.js avvolta da withPWA usando export default
export default pwaConfig(nextConfig);
// --- Fine configurazione next-pwa ---
