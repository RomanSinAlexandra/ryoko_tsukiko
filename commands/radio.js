import {
  joinVoiceChannel,
  createAudioResource,
  StreamType,
  getVoiceConnection
} from '@discordjs/voice';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { radioStations } from '../radio/radio.js';
import { getGuildData } from '../state/state.js'; // Импорт данных сервера
import { cancelAutoLeave } from '../helpers/autoLeave.js';
import { autoDelete } from '../helpers/autoDelete.js';
import { spawn } from 'child_process';

export const name = 'radio';

export const data = new SlashCommandBuilder()
  .setName('radio')
  .setDescription('Хочешь, чтобы я наполнила голосовой своей музыкой?.. Давай, выбирай станцию')
  .addStringOption(option =>
    option
      .setName('station')
      .setDescription('Выбирай радиостанцию… какую атмосферу мне для тебя создать сегодня?')
      .setRequired(true)
      .setAutocomplete(true) 
  );

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const guildData = getGuildData(guildId);
  const key = interaction.options.getString('station');
  const station = radioStations[String(key)]; 

  if (!station) {
    const msg = await interaction.reply({
      content: 'Такой станции нет… Ох, ты хотел что-то особенное? Скажи мне, я придумаю тебе кое-что лучше',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  if (guildData.mode === 'music') {
    const msg = await interaction.reply({
      content: 'Сейчас играет обычная музыка… хочешь радио? Тогда сначала /stop.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  const member = interaction.guild.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice?.channel;
  if (!voiceChannel) {
    const msg = await interaction.reply({
      content: 'Без тебя в голосовом так пусто… заходи скорее, я уже настроила волну специально для тебя.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  let connection = getVoiceConnection(guildId);
  if (!connection) {
    connection = joinVoiceChannel({
      channelId: voiceChannel.id,
      guildId: guildId,
      adapterCreator: interaction.guild.voiceAdapterCreator
    });
    connection.subscribe(guildData.player);
  }

  // Очищаем очередь именно этого сервера
  guildData.queue.length = 0;
  guildData.player.stop();
  guildData.mode = 'radio';

  const ffmpegProcess = spawn('ffmpeg', [
    '-reconnect', '1',
    '-reconnect_streamed', '1',
    '-reconnect_delay_max', '5',
    '-i', station.url,
    '-loglevel', 'warning',
    '-f', 's16le',
    '-ar', '48000',
    '-ac', '2',
    'pipe:1'
  ]);

  ffmpegProcess.stderr.on('data', (data) => {
    const message = data.toString();
    if (!message.includes('Connection reset by peer')) {
       console.error(`[FFmpeg Error ${guildId}] ${message}`);
    }
  });

  ffmpegProcess.stdout.on('close', () => {
    if (!ffmpegProcess.killed) ffmpegProcess.kill('SIGKILL');
  });

  const resource = createAudioResource(ffmpegProcess.stdout, {
    inputType: StreamType.Raw
  });
  
  // Сохраняем станцию в данные гильдии
  guildData.currentRadio = {
    key,
    title: station.title,
    url: station.url
  };

  guildData.player.play(resource);
  cancelAutoLeave(guildId);

  const embed = new EmbedBuilder()
    .setTitle(`Включено радио: ${station.title}. Теперь вся эта музыка — только для нас двоих.`)
    .setColor(0x5865F2)
    .setFooter({ text: `Запрошено: ${interaction.user.tag}.` })
    .addFields({ name: 'URL станции', value: station.url, inline: true });

  const msg = await interaction.reply({ embeds: [embed] });
  autoDelete(msg);
}