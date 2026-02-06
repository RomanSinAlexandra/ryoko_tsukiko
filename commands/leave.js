import { getVoiceConnection } from '@discordjs/voice';
import { SlashCommandBuilder } from 'discord.js';
import { player, queue, state, setMode } from '../state/state.js';
import { cancelAutoLeave } from '../helpers/autoLeave.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'leave';

export const data = new SlashCommandBuilder()
  .setName('leave')
  .setDescription('Хочешь, чтобы я ушла?.. Ну ладно… но только если очень сильно попросишь вернуться.');

export async function execute(interaction) {
  const connection = getVoiceConnection(interaction.guildId);

  if (!connection) {
    const msg = interaction.reply({
      content: 'Меня там нет… Скучаешь? Тогда позови, пока я добрая.',
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

  const msg = await interaction.reply('Ушла… Но ты же знаешь, что я всегда возвращаюсь, если очень попросишь.');
  autoDelete(msg);
}
