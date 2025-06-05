// next.config.mjs

// Force rebuild - Questo commento serve per forzare un nuovo deploy su Vercel.
// Se hai già usato questo commento, puoi cambiarlo leggermente (es. "// Force rebuild 3") o aggiungerne un altro.

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
    // Rimuovi completamente la sezione precacheManifest.
    // next-pwa con Workbox è in grado di generare il precache manifest
    // automaticamente includendo i file di build di Next.js.
  },
});

export default pwaConfig(nextConfig);
// --- Fine configurazione next-pwa ---
