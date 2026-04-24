import { getVoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { SlashCommandBuilder } from 'discord.js';
import { getGuildData } from '../state/state.js';
import { scheduleAutoLeave } from '../helpers/autoLeave.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'stop';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Остановить музыку');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const guildData = getGuildData(guildId);
  const connection = getVoiceConnection(guildId);

  // Проверка: играет ли что-то именно на этом сервере
  if (!connection || (guildData.mode === 'idle' && guildData.queue.length === 0)) {
    const msg = await interaction.reply({
      content: 'Тишина… как мило. Ничего не играет, зато ты можешь услышать только мой голос.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  // Останавливаем музыку только здесь
  guildData.player.stop();
  guildData.queue.length = 0;
  guildData.mode = 'idle';

  const msg = await interaction.reply('Всё затихло… теперь только ты и я. Нравится эта тишина?');
  autoDelete(msg);

  // Запускаем таймер авто-выхода для этого сервера
  scheduleAutoLeave(guildId);
}