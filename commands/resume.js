import { AudioPlayerStatus } from '@discordjs/voice';
import { player, state, setMode } from '../state/state.js';
import { cancelAutoLeave } from '../helpers/autoLeave.js';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'resume';

export const data = new SlashCommandBuilder()
  .setName('resume')
  .setDescription('Хочешь, чтобы я продолжила играть?.. Хорошо… только для тебя возобновляю');

export async function execute(interaction) {

  if (state.mode === 'radio') {
    const msg = interaction.reply({
      content: 'Радио не слушается команды «возобновить»… А ты ведь слушаешься меня, правда?',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  if (!player) {
    const msg = interaction.reply({
      content: 'Плеер ещё спит… Хочешь, я его нежно разбужу? Или ты сделаешь это сам.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  if (player.state.status !== AudioPlayerStatus.Paused) {
    const msg = interaction.reply({
      content: 'Уже играет… ты просто хочешь, чтобы я чаще говорила с тобой, да?',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  const resumed = player.unpause();
  if (!resumed) {
    const msg = interaction.reply({
      content: 'Не получилось возобновить… даже музыка сегодня капризничает. Ну ничего — зато я вся твоя.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  
  setMode('music');

  cancelAutoLeave();

  const msg = await interaction.reply('Продолжаем… ммм, как приятно снова звучать только для тебя.');

  autoDelete(msg);
}
