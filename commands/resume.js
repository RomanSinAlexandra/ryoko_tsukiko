import { AudioPlayerStatus } from '@discordjs/voice';
import { player, state, setMode } from '../state/state.js';
import { cancelAutoLeave } from '../helpers/autoLeave.js';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'resume';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Возобновить воспроизведение');

export async function execute(interaction) {

  if (state.mode === 'radio') {
    const msg = interaction.reply({
      content: 'Радио нельзя возобновить',
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

  if (player.state.status !== AudioPlayerStatus.Paused) {
    const msg = interaction.reply({
      content: 'Воспроизведение не находится на паузе',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  const resumed = player.unpause();
  if (!resumed) {
    const msg = interaction.reply({
      content: 'Не удалось возобновить воспроизведение',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  
  setMode('music');

  cancelAutoLeave();

  const msg = await interaction.reply('Воспроизведение продолжено');

  autoDelete(msg);
}
