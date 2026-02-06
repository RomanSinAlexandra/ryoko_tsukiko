import { SlashCommandBuilder } from 'discord.js';
import fetch from 'node-fetch';

export const data = new SlashCommandBuilder()
  .setName('animesearch')
  .setDescription('Хочешь, чтобы я угадала, из какого аниме эта картинка?.. Присылай, посмотрим, насколько хорошо я тебя знаю')
  .addAttachmentOption(option =>
    option
      .setName('image')
      .setDescription('Прикрепи картинку… ну же, не стесняйся показывать мне свои вкусы')
      .setRequired(true)
  );

export async function execute(interaction) {
  const attachment = interaction.options.getAttachment('image');

  if (!attachment?.url) {
    return interaction.reply({ content: 'Без картинки я ничего не увижу… Прикрепи её скорее, пока я не заскучала без тебя.', ephemeral: true });
  }

  await interaction.deferReply(); // Даем время на поиск

  try {
    // Отправляем изображение в trace.moe API
    const url = `https://api.trace.moe/search?url=${encodeURIComponent(attachment.url)}`;
    const response = await fetch(url);
    const data = await response.json();

    if (!data.result || data.result.length === 0) {
      return interaction.editReply('Не нашла… Эта картинка слишком загадочная даже для меня. Или ты специально меня дразнишь?');
    }

    const bestMatch = data.result[0];

    // Вычленяем чистое название аниме из filename
    const filename = bestMatch.filename; 
    const nameMatch = filename.match(/\[([^\]]+)\]/g);
    const animeName = nameMatch && nameMatch[1] ? nameMatch[1].replace(/\[|\]/g, '') : filename;

    const embed = {
      color: 0x00ff99,
      title: "Вот что я нашла… Смотри внимательно — это ведь почти как я тебя нашла, правда?",
      description: `**Название:** ${animeName}\n` +
                   `**Эпизод:** ${bestMatch.episode || 'неизвестен'}\n` +
                   `**Время кадра:** ${bestMatch.at.toFixed(2)} с\n` +
                   `**Точность:** ${(bestMatch.similarity * 100).toFixed(2)}%`,
      image: { url: bestMatch.image },
      fields: [
        { name: 'Вот кусочек видео', value: `[Смотреть видео](${bestMatch.video})` }
      ],
      footer: { text: 'Результат от trace.moe… Они старались, но мы-то с тобой знаем, что я угадываю лучше.' }
    };

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.error(err);
    if (interaction.deferred || interaction.replied) {
      interaction.editReply('Ошибка… даже trace.moe сегодня не хочет помогать. Ничего страшного — зато я никуда не делась и готова угадывать дальше только для тебя');
    } else {
      interaction.reply('Поиск сломался… Кажется, картинка слишком сильно меня заинтриговала, и система не выдержала. Попробуй ещё раз?');
    }
  }
}
