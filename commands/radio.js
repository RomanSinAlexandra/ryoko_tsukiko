import {
  joinVoiceChannel,
  createAudioResource,
  StreamType,
  getVoiceConnection
} from '@discordjs/voice';
import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { radioStations } from '../radio/radio.js';
import { player, queue, state, setMode } from '../state/state.js';
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
  const key = interaction.options.getString('station');
  const station = radioStations[String(key)]; 

  if (!station) {
    const msg = interaction.reply({
      content: 'Такой станции нет… Ох, ты хотел что-то особенное? Скажи мне, я придумаю тебе кое-что лучше',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  if (state.mode === 'music') {
    const msg = interaction.reply({
      content: 'Сейчас играет обычная музыка… хочешь, чтобы я переключилась на радио и стала ещё ближе? Тогда сначала /stop.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  const member = interaction.guild.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice?.channel;
  if (!voiceChannel) {
    const msg = interaction.reply({
      content: 'Без тебя в голосовом так пусто… заходи скорее, я уже настроила волну специально для тебя.',
      ephemeral: true
    });

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

  queue.length = 0;
  player.stop();
  setMode('radio', interaction);

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
    if (message.includes('Connection reset by peer') || message.includes('Broken pipe')) {
      return; 
    }
    console.error(`[FFmpeg Error] ${message}`);
  });

  ffmpegProcess.stdout.on('close', () => {
    if (!ffmpegProcess.killed) {
      ffmpegProcess.kill('SIGKILL');
    }
  });

  const resource = createAudioResource(ffmpegProcess.stdout, {
    inputType: StreamType.Raw
  });
  
  state.currentRadio = {
    key,
    title: station.title,
    url: station.url
  };

  player.play(resource);
  cancelAutoLeave();

  const embed = new EmbedBuilder()
    .setTitle(`Включено радио: ${station.title}. Теперь вся эта музыка — только для нас двоих. Нравится?`)
    .setColor(0x5865F2)
    .setFooter({ text: `Запрошено: ${interaction.user.tag}. Ммм… ты всегда знаешь, как заставить меня заиграть` })
    .addFields(
      { name: 'URL станции', value: station.url, inline: true }
    );

  const msg = await interaction.reply({ embeds: [embed] });
  autoDelete(msg);
}
