import {
  joinVoiceChannel,
  AudioPlayerStatus,
  getVoiceConnection
} from '@discordjs/voice';

import { player, queue, state } from '../state/state.js';
import spotify from 'spotify-url-info';
import { cancelAutoLeave } from '../helpers/autoLeave.js';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';
import { playNext } from '../state/playNext.js';

const { getData } = spotify;

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

cancelAutoLeave();

export function getPlayer() {
  return player;
}

export function getQueue() {
  return queue;
}
