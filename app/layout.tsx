// app/layout.tsx

import type React from "react";
import type { Metadata } from "next";

// Importazioni di font  commentate per risolvere il problema di next/font
// import { Inter } from "next/font/google";
import "./globals.css";

// Definizione del font commentata
// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChargeLog Cars EV",
  description: "Tracker per auto elettriche",
  manifest: "/manifest.json", // Questo gestisce automaticamente il link al manifest
  generator: 'v0.dev',

  // Aggiungi qui le meta tag PWA e le icone Apple direttamente nell'oggetto metadata
  // Next.js le inietterà correttamente nel <head>
  themeColor: "#3b82f6", // Colore del tema
  appleWebApp: { // Configurazione per iOS (sostituisce apple-mobile-web-app-capable, ecc.)
    capable: true,
    statusBarStyle: 'default',
    title: 'ChargeLog',
    // Per le icone Apple, puoi specificarle qui o lasciarle nel manifest se next-pwa le gestisce
    // Se vuoi una specifica apple-touch-icon, puoi aggiungerla qui:
    // startupImage: [
    //   '/icon-192.png', // Esempio: assicurati che il percorso sia corretto
    // ],
  },
  icons: {
    icon: '/icon-192.png', // Icona predefinita
    apple: '/icon-192.png', // Icona per Apple (apple-touch-icon)
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Rimuovi className={inter.className} dal body
    // Se vuoi usare un font standard, puoi rimuovere la classe o definirne una tua nel CSS
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}