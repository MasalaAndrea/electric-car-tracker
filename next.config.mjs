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
  // disable: process.env.NODE_ENV === 'development', // OPZIONALE: Scommenta questa riga se vuoi disabilitare la PWA durante lo sviluppo
  // buildExcludes: [/middleware.js$/, /middleware.ts$/], // Potrebbe essere necessario per Next.js 15
});

// Esporta la configurazione di Next.js avvolta da withPWA usando export default
export default pwaConfig(nextConfig);
// --- Fine configurazione next-pwa ---
