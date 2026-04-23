# Используем Node.js
FROM node:20-slim

# Устанавливаем системные зависимости
RUN apt-get update && \
    # Добавляем git и build-essential (нужен для компиляции аудио-библиотек)
    apt-get install -y ffmpeg python3 wget git build-essential ca-certificates curl build-essential cmake && \
    # Скачиваем актуальную версию yt-dlp
    wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \
    # Очистка
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /src

# Остальное без изменений...
COPY package*.json ./
RUN npm install
COPY . .
CMD ["node", "index.js"]