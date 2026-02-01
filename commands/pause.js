import { AudioPlayerStatus } from '@discordjs/voice';
import { player, state, setMode } from '../state/state.js';
import { scheduleAutoLeave } from '../helpers/autoLeave.js';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'pause';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Поставить музыку на паузу');

export async function execute(interaction) {
  if (state.mode === 'radio') {
    const msg = interaction.reply({
      content: 'Радио нельзя поставить на паузу',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  if (!player) {
    const msg = interaction.reply({
      content: 'Плеер не инициализирован',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  if (player.state.status !== AudioPlayerStatus.Playing) {
    const msg = interaction.reply({
      content: 'Сейчас ничего не играет',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  player.pause(true);
  setMode('paused');

  const msg = await interaction.reply('Воспроизведение приостановлено');
  autoDelete(msg);

  scheduleAutoLeave(interaction.guildId);
}
