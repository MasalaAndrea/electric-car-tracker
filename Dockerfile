 # Usa un'immagine Node.js come base per la fase di build
    FROM node:18-alpine AS builder

    # Imposta la directory di lavoro all'interno del container
    WORKDIR /app

    # Copia i file package.json e package-lock.json
    COPY package.json yarn.lock* package-lock.json* ./

    # Installa le dipendenze
    # Usa npm install --force se hai ancora problemi di peer dependency
    RUN npm install --force

    # Copia il resto del codice sorgente dell'applicazione
    COPY . .

    # Costruisci l'applicazione Next.js per la produzione
    # Questo passaggio è fondamentale per next-pwa, che genera il service worker durante la build
    RUN npm run build

    # --- Fase di produzione ---
    # Usa un'immagine Node.js più leggera per l'ambiente di produzione
    FROM node:18-alpine AS runner

    # Imposta la directory di lavoro
    WORKDIR /app

    # Imposta le variabili d'ambiente per Next.js
    ENV NODE_ENV production

    # Copia solo i file essenziali dalla fase di build
    COPY --from=builder /app/.next ./.next
    COPY --from=builder /app/node_modules ./node_modules
    COPY --from=builder /app/package.json ./package.json
    COPY --from=builder /app/public ./public

    # Espone la porta su cui Next.js sarà in ascolto
    EXPOSE 3000

    # Comando per avviare l'applicazione Next.js in produzione
    CMD ["npm", "run", "start"]
    