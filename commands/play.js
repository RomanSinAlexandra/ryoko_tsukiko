import {
  joinVoiceChannel,
  createAudioResource,
  AudioPlayerStatus,
  StreamType,
  getVoiceConnection
} from '@discordjs/voice';

import { player, queue, state, setMode } from '../state/state.js';
import { spawn } from 'child_process';
import prism from 'prism-media';
import spotify from 'spotify-url-info';
import { cancelAutoLeave } from '../helpers/autoLeave.js';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getTrackInfo } from '../helpers/getTrackInfo.js';
import { autoDelete } from '../helpers/autoDelete.js';

const { getData } = spotify;

let timeout;

export const name = 'play';

export const data = new SlashCommandBuilder()
  .setName('play')
  .setDescription('Воспроизвести музыку')
  .addStringOption(option =>
    option
      .setName('query')
      .setDescription('Ссылка или название трека')
      .setRequired(true)
  );

export async function execute(interaction) {
  const query = interaction.options.getString('query'); 

  if (!query) {
    const msg = interaction.reply('Укажи ссылку или название трека');
    autoDelete(msg);
    return;
  }

  const member = interaction.guild.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice?.channel;
  if (!voiceChannel){
    const msg = interaction.reply('Зайди в голосовой канал');
    autoDelete(msg);
    return;
  }

  let connection = getVoiceConnection(interaction.guild.id);
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator
    });
    connection.subscribe(player);
  }

  if (state.mode === 'radio') {
    const msg = interaction.reply(
      'Сейчас играет радио. Используй **/stop**, чтобы включить музыку.'
    );
    autoDelete(msg);
    return;
  }

  if (query.includes('open.spotify.com')) {
    try {
      const data = await getData(query);
      query = `${data.artist?.name ?? data.artists[0].name} - ${data.name}`;
    } catch (e) {
      const msg = interaction.reply('Не удалось обработать Spotify ссылку');
      autoDelete(msg);
      return;
    }
  }

  queue.push({ query, interaction });
  const msg = await interaction.reply(`Добавлено в очередь: **${query}**`);
  autoDelete(msg);

  if (player.state.status !== AudioPlayerStatus.Playing) {
    playNext(interaction.guild.id);
  }
}

async function playNext(guildId) {
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
    info = await getTrackInfo(query);
  } catch (e) {
    const msg = interaction.followUp('Не удалось получить информацию о треке');
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

cancelAutoLeave();

export function getPlayer() {
  return player;
}

export function getQueue() {
  return queue;
}
