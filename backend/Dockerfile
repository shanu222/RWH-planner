# RWH Planner API – Railway deploy image
FROM node:22-bookworm-slim

# Chromium renders the PDF reports. Fonts for Urdu/English are bundled in src/fonts.
RUN apt-get update \
 && apt-get install -y --no-install-recommends chromium ca-certificates fonts-liberation \
 && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY src ./src

EXPOSE 8080
CMD ["node", "src/server.js"]
