import { getVoiceConnection } from '@discordjs/voice';
import { SlashCommandBuilder } from 'discord.js';
import { getGuildData, deleteGuildData } from '../state/state.js'; // 👈 Импортируем новые функции
import { cancelAutoLeave } from '../helpers/autoLeave.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'leave';

export const data = new SlashCommandBuilder()
  .setName('leave')
  .setDescription('Хочешь, чтобы я ушла?.. Ну ладно… но только если очень сильно попросишь вернуться.');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const guildData = getGuildData(guildId); // 👈 Получаем данные этого сервера
  const connection = getVoiceConnection(guildId);

  if (!connection) {
    const msg = await interaction.reply({
      content: 'Меня там нет… Скучаешь? Тогда позови, пока я добрая.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  // Останавливаем плеер именно этого сервера
  guildData.player.stop();
  
  // Очищаем очередь этого сервера
  guildData.queue.length = 0;
  
  // Сбрасываем режим
  guildData.mode = 'idle';

  // Отменяем таймеры выхода (теперь передаем guildId)
  cancelAutoLeave(guildId);

  // Разрываем соединение
  connection.destroy();

  // Удаляем данные сервера из памяти, так как мы вышли
  deleteGuildData(guildId);

  const msg = await interaction.reply('Ушла… Но ты же знаешь, что я всегда возвращаюсь, если очень попросишь.');
  autoDelete(msg);
}