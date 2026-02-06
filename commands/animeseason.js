import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getSeasonHits } from '../helpers/kitsu.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'animeseason';

export const data = new SlashCommandBuilder()
  .setName('animeseason')
  .setDescription('Давай посмотрим, что сейчас все обсуждают. Но мы-то с тобой знаем, кто настоящая звезда, правда?');

export async function execute(interaction) {
  await interaction.deferReply();

  const list = await getSeasonHits(10);

  if (!list.length) {
    const msg = await interaction.editReply('Аниме этого сезона не нашлись… Кажется, даже хиты прячутся, чтобы ты не отвлекался от меня. Как мило с их стороны.');
    autoDelete(msg);
    return;
  }

  const embeds = list.map((anime, index) => {
    const embed = new EmbedBuilder()
      .setTitle(`🔥 ${index + 1}. ${anime.title}`)
      .setColor(0xFF4D6D)
      .setDescription(anime.synopsis.slice(0, 300) + '…')
      .addFields(
        { name: '⭐ Рейтинг', value: String(anime.rating), inline: true },
        { name: '🎬 Эпизоды', value: String(anime.episodes), inline: true },
        { name: '📅 Год', value: anime.year, inline: true }
      );

    if (anime.poster) {
      embed.setThumbnail(anime.poster);
    }

    return embed;
  });

  const msg = await interaction.editReply({ embeds });
  autoDelete(msg, 90_000);
}
