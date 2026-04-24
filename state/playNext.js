import {
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  getVoiceConnection
} from '@discordjs/voice';

import { getGuildData } from '../state/state.js'; // 👈 Изменили импорт
import { EmbedBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';
import { spawn } from 'child_process';
import prism from 'prism-media';
import { fetchTrackInfo } from '../helpers/fetchTrackInfo.js';

export async function playNext(guildId) {
  const guildData = getGuildData(guildId); // 👈 Берем данные сервера

  if (!guildData.queue.length) {
    // Используем индивидуальный таймер
    guildData.playNextTimeout = setTimeout(() => {
      const connection = getVoiceConnection(guildId);
      if (connection) connection.destroy();
      guildData.player.stop();
      guildData.mode = 'idle';
    }, 30000);
    return;
  }

  if (guildData.playNextTimeout) {
    clearTimeout(guildData.playNextTimeout);
    guildData.playNextTimeout = null;
  }

  const { query, interaction } = guildData.queue.shift();

  let info;
  try {
    info = await fetchTrackInfo(query);
  } catch (e) {
    const msg = await interaction.followUp('Информацию о треке не удалось взять… он сегодня прячется от меня.');
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

  // Запускаем на плеере сервера
  guildData.player.play(resource);
  guildData.mode = 'music';

  const embed = new EmbedBuilder()
    .setTitle('Я поставила именно то, что ты хотел услышать первым. Нравится?')
    .setColor(0x5865F2)
    .addFields(
      { name: 'Название', value: info.title },
      { name: 'Длительность', value: info.duration, inline: true },
      { name: 'Ссылка', value: `[Открыть](${info.url})`, inline: true }
    )
    .setFooter({ text: `Запросил: ${interaction.user.tag}` });

  const msg = await interaction.followUp({ embeds: [embed] });
  autoDelete(msg);

  // Обязательно используем .once, чтобы обработчики не накапливались
  guildData.player.once(AudioPlayerStatus.Idle, () => {
    playNext(guildId);
  });
  
  ytdlp.stderr.on('data', d => console.error(`yt-dlp [${guildId}]: ${d}`));
  ffmpeg.stderr.on('data', d => console.error(`ffmpeg [${guildId}]: ${d}`));
}