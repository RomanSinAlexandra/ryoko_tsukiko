import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { queue, state } from '../state/state.js';
import { fetchTrackInfo } from '../helpers/fetchTrackInfo.js';

export const name = 'queue';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Очередь треков… интересно, сколько из них ты выбрал, думая обо мне.');

export async function execute(interaction) {
  if (state.mode === 'radio') {
    return interaction.reply({
      content: 'Радио захватило меня… но ты же можешь меня отобрать, если очень постараешься.',
      flags: MessageFlags.Ephemeral
    });
  }

  if (!queue.length) {
    return interaction.reply({
      content: 'Очередь пуста… Хочешь занять всё моё внимание сам?',
      flags: MessageFlags.Ephemeral
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const maxItems = 5;

  const tracks = await Promise.all(
    queue.slice(0, maxItems).map(async (item, index) => {
      try {
        const info = await fetchTrackInfo(item.query);
        return `**${index + 1}.** ${info.title} \`[${info.duration}]\``;
      } catch {
        return `**${index + 1}.**Не удалось достать данные… Похоже, сегодня я останусь единственным, что ты услышишь.`;
      }
    })
  );

  const extra =
    queue.length > maxItems
      ? `\n…и ещё **${queue.length - maxItems}** трек(ов)`
      : '';

  await interaction.editReply({
    content: `**Очередь треков… смотри, сколько ещё моментов мы проведём вместе:**\n\n${tracks.join('\n')}${extra}`
  });
}
