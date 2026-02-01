import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { queue, state } from '../state/state.js';
import { fetchTrackInfo } from '../helpers/fetchTrackInfo.js';

export const name = 'queue';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Показать очередь воспроизведения');

export async function execute(interaction) {
  if (state.mode === 'radio') {
    return interaction.reply({
      content: '📻 Сейчас играет радио. Очередь недоступна.',
      flags: MessageFlags.Ephemeral
    });
  }

  if (!queue.length) {
    return interaction.reply({
      content: '📭 Очередь пуста',
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
        return `**${index + 1}.** Не удалось получить информацию`;
      }
    })
  );

  const extra =
    queue.length > maxItems
      ? `\n…и ещё **${queue.length - maxItems}** трек(ов)`
      : '';

  await interaction.editReply({
    content: `**Очередь воспроизведения:**\n\n${tracks.join('\n')}${extra}`
  });
}
