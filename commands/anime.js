import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { searchAnime } from '../helpers/kitsu.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'anime';

export const data = new SlashCommandBuilder()
  .setName('anime')
  .setDescription('Поиск аниме')
  .addStringOption(opt =>
    opt
      .setName('title')
      .setDescription('Название аниме')
      .setRequired(true)
  );

export async function execute(interaction) {
  const query = interaction.options.getString('title');
  await interaction.deferReply();

  let results;
  try {
    results = await searchAnime(query);
  } catch {
    const msg = await interaction.editReply('❌ Ошибка при запросе к Kitsu');
    autoDelete(msg);
    return;
  }

  if (!results.length) {
    const msg = await interaction.editReply('😔 Ничего не найдено');
    autoDelete(msg);
    return;
  }

  const embeds = results.slice(0, 5).map((anime, index) => {
    const embed = new EmbedBuilder()
      .setTitle(`${index + 1}. ${anime.title}`)
      .setColor(0xF75239)
      .addFields(
        { name: '📅 Год', value: anime.year ?? '—', inline: true },
        { name: '⭐ Рейтинг', value: String(anime.rating ?? '—'), inline: true },
        { name: '🎬 Эпизоды', value: String(anime.episodes ?? '—'), inline: true }
      );

    if (anime.synopsis) {
      embed.setDescription(anime.synopsis.slice(0, 400) + '…');
    }

    if (anime.poster) {
      embed.setImage(anime.poster);
    }

    return embed;
  });

  const msg = await interaction.editReply({ embeds });
  autoDelete(msg, 90_000);
}
