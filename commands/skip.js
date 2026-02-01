import { player, queue, state } from '../state/state.js';
import { AudioPlayerStatus } from '@discordjs/voice';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'skip';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Пропустить текущую композицию');

export async function execute(interaction) {

  if (state.mode === 'radio') {
    const msg = interaction.reply({
      content: 'Сейчас играет радио. Пропуск недоступен.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  if (!player || player.state.status !== AudioPlayerStatus.Playing) {
    const msg = interaction.reply({
      content: 'Сейчас ничего не играет',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  if (!queue.length) {
    const msg = await interaction.reply('Текущий трек пропущен. Очередь пуста.');
    autoDelete(msg);
  } else {
    const msg = await interaction.reply('Трек пропущен');
    autoDelete(msg);
  }

  player.stop(true);
}
