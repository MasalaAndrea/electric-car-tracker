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
  disable: process.env.NODE_ENV === 'development', // Disabilita in sviluppo, abilita in produzione

  // Configurazione Workbox per il caching
  workboxOptions: {
    // Queste sono le rotte che verranno precacheate automaticamente
    // La strategia NetworkFirst è robusta per le PWA
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
    // Aggiungi qui solo le risorse essenziali che Workbox potrebbe non precachare automaticamente
    // Il manifest e le icone sono cruciali per l'installazione e l'offline
    precacheManifest: [
      { url: '/', revision: null }, // La homepage
      { url: '/manifest.json', revision: null }, // Il manifest
      { url: '/android-chrome-192x192.png', revision: null }, // Icona 192x192
      { url: '/android-chrome-512x512.png', revision: null }, // Icona 512x512
    ].concat(self.__WB_MANIFEST || []), // Concatena con il manifest generato automaticamente da Workbox
  },
});

export default pwaConfig(nextConfig);
// --- Fine configurazione next-pwa ---

