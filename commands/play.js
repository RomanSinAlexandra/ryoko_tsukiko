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
  .setDescription('Музыка? Ммм… Назови её, и я заставлю её звучать так, как ты любишь.')
  .addStringOption(option =>
    option
      .setName('query')
      .setDescription('Давай, кидай ссылку или просто скажи название… я вся внимание.')
      .setRequired(true)
  );

export async function execute(interaction) {
  const query = interaction.options.getString('query'); 

  if (!query) {
    const msg = interaction.reply('Назови песню… или лучше — скажи, о чём ты сейчас думаешь, глядя на меня.');
    autoDelete(msg);
    return;
  }

  const member = interaction.guild.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice?.channel;
  if (!voiceChannel){
    const msg = interaction.reply('Без тебя в голосовом так пусто… заходи, пока я не заскучала по-настоящему.');
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
      'Радио мешает… Хочешь, чтобы я звучала только для тебя? Тогда /stop.'
    );
    autoDelete(msg);
    return;
  }

  if (query.includes('open.spotify.com')) {
    try {
      const data = await getData(query);
      query = `${data.artist?.name ?? data.artists[0].name} - ${data.name}`;
    } catch (e) {
      const msg = interaction.reply('Spotify-ссылка не поддалась… Какая дерзость. Попробуй ещё раз — и на этот раз лучше не разочаровывай меня.');
      autoDelete(msg);
      return;
    }
  }

  queue.push({ query, interaction });
  const msg = await interaction.reply(`Твоя песня встала в очередь… как и ты — в мои мысли на сегодня: **${query}**`);
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
