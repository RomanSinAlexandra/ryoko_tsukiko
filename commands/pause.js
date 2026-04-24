import { AudioPlayerStatus } from '@discordjs/voice';
import { getGuildData } from '../state/state.js'; // Используем новую функцию
import { scheduleAutoLeave } from '../helpers/autoLeave.js';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'pause';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Тсс… замри. Пусть музыка подождёт, пока я на тебя смотрю.');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const guildData = getGuildData(guildId);

  if (guildData.mode === 'radio') {
    const msg = await interaction.reply({
      content: 'Радио не слушается меня… а ты ведь слушаешься?',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  // Проверяем статус плеера конкретного сервера
  const isPlaying = guildData.player.state.status === AudioPlayerStatus.Playing;

  if (!isPlaying) {
    const msg = await interaction.reply({
      content: 'Ничего не играет… Хочешь, я сама тебе спою? На ушко.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  guildData.player.pause();
  guildData.mode = 'paused';

  const msg = await interaction.reply('Замерла… как ты, когда я смотрю тебе прямо в глаза.');
  autoDelete(msg);

  // Передаем guildId в планировщик выхода
  scheduleAutoLeave(guildId);
}