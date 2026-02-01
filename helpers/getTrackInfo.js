import { spawn } from 'child_process';

export function getTrackInfo(query) {
  return new Promise((resolve, reject) => {
    const isUrl = query.startsWith('http');

    const ytdlp = spawn('yt-dlp', [
      '--no-playlist',
      '--dump-json',
      '--quiet',
      isUrl ? query : `ytsearch1:${query}`
    ]);

    let data = '';

    ytdlp.stdout.on('data', chunk => (data += chunk));
    ytdlp.on('close', () => {
      try {
        const json = JSON.parse(data);

        resolve({
          title: json.title,
          duration: formatDuration(json.duration),
          url: json.webpage_url
        });
      } catch (e) {
        reject(e);
      }
    });

    ytdlp.on('error', reject);
  });
}

function formatDuration(seconds = 0) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
