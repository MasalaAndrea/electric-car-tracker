// app/layout.tsx

import type React from "react";
import type { Metadata } from "next";

// Rimuovi o commenta completamente le importazioni di font se non strettamente necessarie per evitare problemi di build/hydration
// import { Inter } from "next/font/google";
import "./globals.css";

// Rimuovi o commenta la definizione del font se non strettamente necessaria
// const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ChargeLog Cars EV",
  description: "Tracker per auto elettriche",
  manifest: "/manifest.json", // Questo gestisce automaticamente il link al manifest
  generator: 'v0.dev',

  themeColor: "#3b82f6", // Colore del tema per la PWA
  appleWebApp: { // Configurazione per iOS PWA
    capable: true,
    statusBarStyle: 'default',
    title: 'ChargeLog',
  },
  icons: { // Icone per la PWA e Apple Touch Icon
    icon: '/android-chrome-192x192.png', // Icona predefinita
    apple: '/android-chrome-192x192.png', // Icona per Apple (apple-touch-icon)
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // Assicurati che non ci siano riferimenti a `inter.className` se hai rimosso l'importazione del font
    <html lang="it">
      <body>{children}</body>
    </html>
  );
}
