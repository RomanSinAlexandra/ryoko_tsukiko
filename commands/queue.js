import { SlashCommandBuilder, MessageFlags } from 'discord.js';
import { getGuildData } from '../state/state.js';
import { fetchTrackInfo } from '../helpers/fetchTrackInfo.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'queue';

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Очередь треков… интересно, сколько из них ты выбрал, думая обо мне.');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const guildData = getGuildData(guildId);

  if (guildData.mode === 'radio') {
    return interaction.reply({
      content: 'Радио захватило меня… но ты же можешь меня отобрать, если очень постараешься. Сначала /stop.',
      flags: MessageFlags.Ephemeral
    });
  }

  if (!guildData.queue.length) {
    return interaction.reply({
      content: 'Очередь пуста… Хочешь занять всё моё внимание сам? Просто добавь трек через /play.',
      flags: MessageFlags.Ephemeral
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const maxItems = 5;

  const tracks = await Promise.all(
    guildData.queue.slice(0, maxItems).map(async (item, index) => {
      try {
        const info = await fetchTrackInfo(item.query);
        return `**${index + 1}.** ${info.title} \`[${info.duration}]\``;
      } catch {
        return `**${index + 1}.** Не удалось достать данные… Но я всё равно помню, что ты это просил.`;
      }
    })
  );

  const extra =
    guildData.queue.length > maxItems
      ? `\n…и ещё **${guildData.queue.length - maxItems}** трек(ов)`
      : '';

  const responseContent = `**Очередь треков… смотри, сколько ещё моментов мы проведём вместе:**\n\n${tracks.join('\n')}${extra}`;

  await interaction.editReply({
    content: responseContent
  });
}