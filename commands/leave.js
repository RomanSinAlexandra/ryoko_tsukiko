import { getVoiceConnection } from '@discordjs/voice';
import { SlashCommandBuilder } from 'discord.js';
import { player, queue, state, setMode } from '../state/state.js';
import { cancelAutoLeave } from '../helpers/autoLeave.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'leave';

export const data = new SlashCommandBuilder()
  .setName('leave')
  .setDescription('Заставить бота выйти из голосового канала');

export async function execute(interaction) {
  const connection = getVoiceConnection(interaction.guildId);

  if (!connection) {
    const msg = interaction.reply({
      content: 'Я не нахожусь в голосовом канале',
      ephemeral: true
    });

    autoDelete(msg);
    return;
  }

  player.stop();
  queue.length = 0;
  setMode('idle');
  cancelAutoLeave();

  connection.destroy();

  const msg = await interaction.reply('Я вышел из голосового канала');
  autoDelete(msg);
}
