import { AudioPlayerStatus } from '@discordjs/voice';
import { getGuildData } from '../state/state.js';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'skip';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Скучно стало? Пропускаем… надеюсь, я тебя не разочарую дальше.');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const guildData = getGuildData(guildId);

  if (guildData.mode === 'radio') {
    const msg = await interaction.reply({
      content: 'Пропуск недоступен — радио слишком упрямое. Хочешь тишины? Тогда /stop.',
      ephemeral: true,
      fetchReply: true
    });
    autoDelete(msg);
    return;
  }

  // Проверяем, играет ли что-то сейчас
  if (guildData.player.state.status !== AudioPlayerStatus.Playing) {
    const msg = await interaction.reply({
      content: 'Пусто… как и мои мысли без твоего следующего приказа.',
      ephemeral: true,
      fetchReply: true
    });
    autoDelete(msg);
    return;
  }

  let replyText = guildData.queue.length > 0 
    ? 'Ушёл… А ты останешься со мной подольше? Включаю следующий трек.' 
    : 'Скучно? Пропускаем… Очередь пуста, так что я побуду в тишине, пока ты не выберешь что-то новое.';

  const msg = await interaction.reply({ content: replyText, fetchReply: true });
  autoDelete(msg);

  // Остановка плеера вызовет событие Idle в playNext.js, которое запустит следующий трек
  guildData.player.stop(true);
}