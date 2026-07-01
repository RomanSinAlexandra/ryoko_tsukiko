FROM node:22-slim

RUN apt-get update && \
    apt-get install -y ffmpeg python3 wget git build-essential ca-certificates curl cmake && \

    ln -s /usr/bin/python3 /usr/bin/python && \

    wget https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -O /usr/local/bin/yt-dlp && \
    chmod a+rx /usr/local/bin/yt-dlp && \

    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /src

COPY package*.json ./

RUN npm install

COPY . .

CMD ["node", "index.js"]