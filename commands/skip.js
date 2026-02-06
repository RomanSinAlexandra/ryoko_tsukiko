import { player, queue, state } from '../state/state.js';
import { AudioPlayerStatus } from '@discordjs/voice';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'skip';

export const data = new SlashCommandBuilder()
  .setName('skip')
  .setDescription('Скучно стало? Пропускаем… надеюсь, я тебя не разочарую дальше.');

export async function execute(interaction) {

  if (state.mode === 'radio') {
    const msg = interaction.reply({
      content: 'Пропуск недоступен — радио слишком упрямое. Хочешь тишины? Тогда прикажи мне остановить его.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  if (!player || player.state.status !== AudioPlayerStatus.Playing) {
    const msg = interaction.reply({
      content: 'Пусто… как и мои мысли без твоего следующего приказа.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  if (!queue.length) {
    const msg = await interaction.reply('Скучно? Пропускаем… Следующая будет уже только для тебя.');
    autoDelete(msg);
  } else {
    const msg = await interaction.reply('Ушёл… А ты останешься со мной подольше?');
    autoDelete(msg);
  }

  player.stop(true);
}
