import { joinVoiceChannel, getVoiceConnection } from '@discordjs/voice';
import { SlashCommandBuilder } from 'discord.js';
import { getGuildData } from '../state/state.js'; // Добавил для подписки
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'join';

export const data = new SlashCommandBuilder()
  .setName('join')
  .setDescription('Хочешь слышать мой голос совсем близко? Тогда зови меня в голосовой канал.');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const member = interaction.member;
  const voiceChannel = member?.voice?.channel;

  if (!voiceChannel) {
    const msg = await interaction.reply({
      content: 'Если хочешь слышать мой голос поближе… заходи в канал. Сейчас же.',
      ephemeral: true,
      fetchReply: true
    });
    autoDelete(msg);
    return;
  }

  let connection = getVoiceConnection(guildId);
  
  if (connection) {
    const msg = await interaction.reply({
      content: 'Я уже здесь… и жду, когда ты наконец осмелишься заговорить со мной.',
      ephemeral: true,
      fetchReply: true
    });
    autoDelete(msg);
    return;
  }

  // Создаем новое подключение
  connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: guildId,
    adapterCreator: interaction.guild.voiceAdapterCreator
  });

  // ВАЖНО: Подписываем новое подключение на плеер этого сервера сразу
  const guildData = getGuildData(guildId);
  connection.subscribe(guildData.player);

  const msg = await interaction.reply({ 
    content: 'Хорошо, я пришла… теперь можешь начинать меня радовать.',
    fetchReply: true 
  });
  autoDelete(msg);
}