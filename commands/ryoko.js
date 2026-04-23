import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import { getImagesByCategory } from '../services/imageService.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const data = new SlashCommandBuilder()
  .setName('ryoko')
  .setDescription('Хочешь меня разглядывать?.. Назови категорию и не отводи глаз.')
  .addStringOption(option =>
    option
      .setName('category')
      .setDescription('Какую меня хочешь сегодня?.. Назови категорию.')
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function execute(interaction) {
  const category = interaction.options.getString('category');

  await interaction.deferReply();

  try {
    const images = await getImagesByCategory(category, interaction.channel?.nsfw);

    if (!images.length) {
      const msg = await interaction.editReply(
        'Сегодня мои фото капризничают… ничего не нашлось.'
      );
      autoDelete(msg);
      return;
    }

    const random = images[Math.floor(Math.random() * images.length)];

    const file = new AttachmentBuilder(random.url);

    await interaction.editReply({
      content: `**Рьоко / ${category}**`,
      files: [file]
    });

  } catch (err) {
    console.error(err);
    const msg = await interaction.editReply(
      'Что-то пошло не так… даже база не хочет делиться.'
    );
    autoDelete(msg);
  }
}