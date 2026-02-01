import { spawn } from 'child_process';

export function fetchTrackInfo(query) {
  return new Promise((resolve, reject) => {
    const ytdlp = spawn('yt-dlp', [
      '--dump-single-json',
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

function formatDuration(seconds = 0) {
  if (!seconds || isNaN(seconds)) return '??:??';

  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${m}:${String(s).padStart(2, '0')}`;
}
