import { SlashCommandBuilder, AttachmentBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('ryoko')
  .setDescription('Хочешь меня разглядывать?.. Назови категорию и не отводи глаз.')
  .addStringOption(option =>
    option
      .setName('category')
      .setDescription('Какую меня хочешь сегодня?.. Назови категорию, не стесняйся.')
      .setRequired(true)
      .setAutocomplete(true)
  );

export async function execute(interaction) {
  const category = interaction.options.getString('category');
  await interaction.deferReply();

  try {
    const res = await fetch(
      `http://localhost:3000/api/image?category=${encodeURIComponent(category)}`
    );

    const images = await res.json();

    if (!res.ok || !images.length) {
      return interaction.editReply('е мои фото сегодня капризничают… Придётся тебе фантазировать самому.');
    }

    // 🎲 случайная картинка
    const random = images[Math.floor(Math.random() * images.length)];

    const file = new AttachmentBuilder(random.url);

    await interaction.editReply({
      content: `**Рьоко / ${category}**`,
      files: [file]
    });

  } catch (err) {
    console.error(err);
    await interaction.editReply('Даже API отказывается меня отдавать… Похоже, хочет, чтобы ты фантазировал сам.');
  }
}
