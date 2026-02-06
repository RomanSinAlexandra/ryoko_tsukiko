import { AudioPlayerStatus } from '@discordjs/voice';
import { player, state, setMode } from '../state/state.js';
import { scheduleAutoLeave } from '../helpers/autoLeave.js';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'pause';

export const data = new SlashCommandBuilder()
  .setName('pause')
  .setDescription('Тсс… замри. Пусть музыка подождёт, пока я на тебя смотрю.');

export async function execute(interaction) {
  if (state.mode === 'radio') {
    const msg = interaction.reply({
      content: 'Радио не слушается меня… а ты ведь слушаешься?',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  if (!player) {
    const msg = interaction.reply({
      content: 'Плеер ещё не проснулся… Хочешь, чтобы я его разбудила лично для тебя?',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  if (player.state.status !== AudioPlayerStatus.Playing) {
    const msg = interaction.reply({
      content: 'Ничего не играет… Хочешь, я сама тебе спою? На ушко.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  player.pause(true);
  setMode('paused');

  const msg = await interaction.reply('Замерла… как ты, когда я смотрю тебе прямо в глаза.');
  autoDelete(msg);

  scheduleAutoLeave(interaction.guildId);
}
