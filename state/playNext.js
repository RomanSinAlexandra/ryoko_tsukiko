import {
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  getVoiceConnection
} from '@discordjs/voice';

import { player, queue, state, setMode } from '../state/state.js';
import { EmbedBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';
import { spawn } from 'child_process';
import prism from 'prism-media';
import { fetchTrackInfo } from '../helpers/fetchTrackInfo.js';

let timeout;

export async function playNext(guildId) {
  if (!queue.length) {
    timeout = setTimeout(() => {
      const connection = getVoiceConnection(guildId);
      if (connection) connection.destroy();
      player.stop();
      state.mode = 'idle';
    }, 30000);
    return;
  }

  if (timeout) {
    clearTimeout(timeout);
    timeout = null;
  }

  const { query, interaction } = queue.shift();

  let info;
  try {
    info = await fetchTrackInfo(query);
  } catch (e) {
    const msg = await interaction.followUp('Не удалось получить информацию о треке');
    autoDelete(msg);
    return playNext(guildId);
  }

  const ytdlp = spawn('yt-dlp', [
    '--cookies', 'cookies.txt',
    '-f', 'bestaudio[ext=webm]/bestaudio/best',
    '--no-playlist',
    '--quiet',
    '-o', '-',
    info.url
  ]);

  const ffmpeg = spawn('ffmpeg', [
    '-i', 'pipe:0',
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2',
    'pipe:1'
  ]);

  ytdlp.stdout.pipe(ffmpeg.stdin);

  const opus = new prism.opus.Encoder({
    rate: 48000,
    channels: 2,
    frameSize: 960
  });

  const stream = ffmpeg.stdout.pipe(opus);
  const resource = createAudioResource(stream, {
    inputType: StreamType.Opus
  });

  player.play(resource);
  setMode('music');

  const embed = new EmbedBuilder()
    .setTitle('🎶 Сейчас играет')
    .setColor(0x5865F2)
    .addFields(
      { name: 'Название', value: info.title },
      { name: 'Длительность', value: info.duration, inline: true },
      { name: 'Ссылка', value: `[Открыть](${info.url})`, inline: true }
    )
    .setFooter({ text: `Запросил: ${interaction.user.tag}` });

  const msg = await interaction.followUp({ embeds: [embed] });
  autoDelete(msg);

  player.once(AudioPlayerStatus.Idle, () => {
    playNext(guildId);
  });
  
  //  ytdlp.stderr.on('data', d => console.error(`yt-dlp: ${d}`));
  //  ffmpeg.stderr.on('data', d => console.error(`ffmpeg: ${d}`));
    
}