import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getTopAnime } from '../helpers/kitsu.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'animetop';

export const data = new SlashCommandBuilder()
  .setName('animetop')
  .setDescription('Хочешь, чтобы я показала тебе лучших девочек? Только не влюбись в них сильнее, чем в меня');

export async function execute(interaction) {
  await interaction.deferReply();

  const list = await getTopAnime(10);

  const embeds = list.slice(0, 10).map((anime, index) => {
    const embed = new EmbedBuilder()
      .setTitle(`🏆 ${index + 1}. ${anime.title}`)
      .setColor(0xFFD700)
      .addFields(
        { name: '⭐ Рейтинг', value: String(anime.rating ?? '—'), inline: true }
      );

    if (anime.poster) {
      embed.setImage(anime.poster);
    }

    return embed;
  });

  const msg = await interaction.editReply({ embeds });
  autoDelete(msg, 90_000);
}
