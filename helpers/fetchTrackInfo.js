import { spawn } from 'child_process';
import { formatDuration } from '../helpers/formatDuration.js';

export function fetchTrackInfo(query) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '--dump-json',
      '--no-playlist',
      '--quiet',
      query.startsWith('http') ? query : `ytsearch1:${query}`
    ]);

    let data = '';

    ytdlp.stdout.on('data', chunk => (data += chunk));

    ytdlp.on('close', () => {
      try {
        const json = JSON.parse(data);

        resolve({
          title: json.title || 'Без названия',
          duration: formatDuration(json.duration),
          url: json.webpage_url || null
        });
      } catch (e) {
        reject(e);
      }
    });

    ytdlp.on('error', reject);
  });
}