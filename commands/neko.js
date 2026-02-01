import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const data = new SlashCommandBuilder()
  .setName('neko')
  .setDescription('Получить аниме арт')
  .addStringOption(option =>
    option
      .setName('type')
      .setDescription('Тип аниме арта')
      .addChoices(
        { name: 'neko', value: 'neko' },
        { name: 'waifu', value: 'waifu' },
        { name: 'hug', value: 'hug' },
        { name: 'pat', value: 'pat' },
        { name: 'kiss', value: 'kiss' },
        { name: 'smile', value: 'smile' },
        { name: 'wave', value: 'wave' },
        { name: 'dance', value: 'dance' },
        { name: 'wink', value: 'wink' }
      )
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const type = interaction.options.getString('type') ?? 'neko';

  try {
    const res = await fetch(`https://nekos.best/api/v2/${type}`);
    const data = await res.json();

    const art = data.results?.[0];
    if (!art) {
      const msg = interaction.editReply('❌ Не удалось получить арт');
      autoDelete(msg);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(`🐾 ${type.toUpperCase()}`)
      .setImage(art.url)
      .setColor(0xFFB7C5)
      .setFooter({
        text: art.artist_name
          ? `Автор: ${art.artist_name}`
          : 'Источник: nekos.best'
      });

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.error(err);
    const msg = await interaction.editReply('Ошибка при получении арта');
    autoDelete(msg);
  }
}
