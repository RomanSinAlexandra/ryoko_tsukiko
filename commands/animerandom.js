import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getRandomAnime } from '../helpers/kitsu.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'animerandom';

export const data = new SlashCommandBuilder()
  .setName('animerandom')
  .setDescription('Случайное аниме');

export async function execute(interaction) {
  await interaction.deferReply();

  const anime = await getRandomAnime();
  if (!anime) {
    const msg = await interaction.editReply('❌ Не удалось получить аниме');
    autoDelete(msg);
    return;
  }

  const embed = new EmbedBuilder()
    .setTitle(anime.title)
    .setDescription(anime.synopsis.slice(0, 400) + '…')
    .setColor(0xF75239)
    .addFields(
      { name: '⭐ Рейтинг', value: String(anime.rating), inline: true },
      { name: '🎬 Эпизоды', value: String(anime.episodes), inline: true },
      { name: '📅 Год', value: anime.year, inline: true }
    );

  if (anime.poster) embed.setThumbnail(anime.poster);

  const msg = await interaction.editReply({ embeds: [embed] });
  autoDelete(msg, 60_000);
}
