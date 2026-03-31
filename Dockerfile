# ================================================
# KurtBot - WhatsApp IA | LIBRE La Paz
# Ubuntu + Chromium (requerido por whatsapp-web.js)
# ================================================
FROM node:22-slim

# Instalar Chromium y dependencias para whatsapp-web.js
RUN apt-get update && apt-get install -y \
    chromium \
    fonts-liberation \
    fonts-noto-color-emoji \
    libasound2 \
    libatk-bridge2.0-0 \
    libatk1.0-0 \
    libcups2 \
    libdrm2 \
    libgbm1 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libx11-xcb1 \
    libxcomposite1 \
    libxdamage1 \
    libxfixes3 \
    libxrandr2 \
    libxss1 \
    libxtst6 \
    wget \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Directorio de trabajo
WORKDIR /app

# Copiar package.json primero (para aprovechar cache de Docker)
COPY package.json .

# Instalar dependencias Node
RUN npm install --production

# Copiar el resto del código
COPY src/ ./src/
COPY public/ ./public/
COPY data/ ./data/

# Crear directorios para persistencia
RUN mkdir -p /app/.wwebjs_auth /app/data

# Variable para que Puppeteer use Chromium del sistema
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

# Puerto del panel admin
EXPOSE 3000

# Arrancar el bot
CMD ["node", "src/server.js"]
