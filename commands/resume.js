import { AudioPlayerStatus } from '@discordjs/voice';
import { getGuildData } from '../state/state.js';
import { cancelAutoLeave } from '../helpers/autoLeave.js';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'resume';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Хочешь, чтобы я продолжила играть?.. Хорошо… только для тебя возобновляю');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const guildData = getGuildData(guildId);

  if (guildData.mode === 'radio') {
    const msg = await interaction.reply({
      content: 'Радио не слушается команды «возобновить»… А ты ведь слушаешься меня, правда?',
      ephemeral: true,
      fetchReply: true
    });
    autoDelete(msg);
    return;
  }

  // Проверяем плеер конкретного сервера
  if (guildData.player.state.status !== AudioPlayerStatus.Paused) {
    const msg = await interaction.reply({
      content: 'Уже играет… ты просто хочешь, чтобы я чаще говорила с тобой, да?',
      ephemeral: true,
      fetchReply: true
    });
    autoDelete(msg);
    return;
  }

  const resumed = guildData.player.unpause();
  
  if (!resumed) {
    const msg = await interaction.reply({
      content: 'Не получилось возобновить… даже музыка сегодня капризничает.',
      ephemeral: true,
      fetchReply: true
    });
    autoDelete(msg);
    return;
  }

  guildData.mode = 'music';
  cancelAutoLeave(guildId);

  const msg = await interaction.reply({ 
    content: 'Продолжаем… ммм, как приятно снова звучать только для тебя.',
    fetchReply: true 
  });
  autoDelete(msg);
}