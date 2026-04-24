import {
  joinVoiceChannel,
  AudioPlayerStatus,
  getVoiceConnection,
  VoiceConnectionStatus,
  entersState // 👈 ВАЖНО: добавил недостающий импорт
} from '@discordjs/voice';

import { getGuildData } from '../state/state.js'; // 👈 Изменили импорт
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
  const guildId = interaction.guild.id;
  const guildData = getGuildData(guildId); // 👈 Получаем данные ИМЕННО этого сервера

  cancelAutoLeave(guildId); // 👈 Передаем guildId

  const query = interaction.options.getString('query'); 
  const member = interaction.guild.members.cache.get(interaction.user.id);
  const voiceChannel = member?.voice?.channel;

  if (!voiceChannel){
    const msg = await interaction.reply('Без тебя в голосовом так пусто… заходи, пока я не заскучала по-настоящему.');
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
    
    // Подписываемся на плеер ЭТОГО сервера
    connection.subscribe(guildData.player);

    connection.on(VoiceConnectionStatus.Disconnected, async () => {
        try {
            await Promise.race([
                entersState(connection, VoiceConnectionStatus.Signalling, 1000),
                entersState(connection, VoiceConnectionStatus.Connecting, 1000),
            ]);
        } catch (e) {
            console.log(`🚪 Рёко покинула канал на сервере ${guildId}.`);
            guildData.mode = 'idle';
            guildData.queue.length = 0;
            if (connection.state.status !== VoiceConnectionStatus.Destroyed) {
                connection.destroy();
            }
        }
    });
  }

  if (guildData.mode === 'radio') {
    const msg = await interaction.reply('Радио мешает… Хочешь, чтобы я звучала только для тебя? Тогда /stop.');
    autoDelete(msg);
    return;
  }

  let searchQuery = query;
  if (query.includes('spotify.com')) {
    try {
      const data = await getData(query);
      searchQuery = `${data.artist?.name ?? data.artists[0].name} - ${data.name}`;
    } catch (e) {
      const msg = await interaction.reply('Spotify-ссылка не поддалась… Попробуй ещё раз.');
      autoDelete(msg);
      return;
    }
  }

  // Пушим песню в очередь ЭТОГО сервера
  guildData.queue.push({ query: searchQuery, interaction });
  guildData.mode = 'music';

  const msg = await interaction.reply(`Твоя песня встала в очередь… как и ты — в мои мысли: **${searchQuery}**`);
  autoDelete(msg);

  // Проверяем статус плеера ЭТОГО сервера
  if (guildData.player.state.status !== AudioPlayerStatus.Playing) {
    playNext(guildId);
  }
}