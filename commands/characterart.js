import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'characterart';

export const data = new SlashCommandBuilder()
  .setName('characterart')
  .setDescription('Хочешь арт с testbooru?.. Только для взрослых глаз. Готов перейти в NSFW-канал?')
  .addStringOption(opt =>
    opt
      .setName('tags')
      .setDescription('Теги… пиши смело, что тебе хочется увидеть сегодня')
      .setRequired(false)
      .setAutocomplete(true) 
  )
  .addStringOption(opt =>
  opt
    .setName('rating')
    .setDescription('Какой фильтр выбрать?.. SFW, NSFW или Questionable? Я подстроюсь под тебя')
    .setRequired(false)
    .addChoices(
      { name: 'SFW… мило и безопасно. Давай посмотрим что-нибудь нежное', value: 's' },
      { name: 'NSFW… ого, ты сегодня смелый. Только в 18+ канале, хорошо?', value: 'e' },
      { name: 'Questionable… на грани. Интересный выбор. Переходим в NSFW?', value: 'q' }
    )
);

export async function execute(interaction) {
  const tagsInput = interaction.options.getString('tags')?.trim() || '';
const rating = interaction.options.getString('rating'); // s | q | e

  if (!interaction.channel?.nsfw && rating !== 's') {
    const msg = await interaction.reply({
      content: 'Только в NSFW-каналах… пойдём туда? Мне не терпится показать тебе, что я нашла.',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  let tags = interaction.options.getString('tags')?.trim() || '';
  tags = tags.split(' ')[0]; // берём только первый

  if (rating) {
    tags = tags.length
      ? `${tags} rating:${rating}`
      : `rating:${rating}`;
  }

  await interaction.deferReply();

  try {
    const params = {
      page: 'dapi',
      s: 'post',
      q: 'index',
      json: 1,
      limit: 100,
      tags
    };

    const url =
      'https://danbooru.donmai.us/posts.json?' +
      new URLSearchParams(params).toString();

    const res = await axios.get(url);

    if (!Array.isArray(res.data) || res.data.length === 0) {
      const msg = await interaction.editReply('Ничего не нашлось… эти теги слишком загадочные даже для меня. Попробуем другие?');
      autoDelete(msg);
      return;
    }

    // Фильтрация
    const valid = res.data.filter(p =>
      p.file_url &&
      !p.file_url.endsWith('.webm') &&
      !p.file_url.endsWith('.mp4')
    );

    if (!valid.length) {
      const msg = await interaction.editReply('Подходящих артов нет… видимо, они стесняются. Давай поищем что-то другое вместе?');
      autoDelete(msg);
      return;
    }

    const post = valid[Math.floor(Math.random() * valid.length)];

    const embed = new EmbedBuilder()
      .setTitle('Testbooru \nВот что удалось найти… смотри внимательно')
      .setColor(0xE91E63)
      .setImage(post.file_url)
      .setDescription(tags ? `**Теги:** ${tags}` : 'Без тегов')
      .setFooter({
        text: `ID: ${post.id} • Rating: ${post.rating?.toUpperCase() || 'N/A'}`
      });

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.error('TESTBOORU ERROR:', err?.response?.data || err.message);
    const msg = await interaction.editReply('Ошибка с testbooru… даже он сегодня капризничает. Не расстраивайся — я всё равно здесь и готова тебя порадовать.');
    autoDelete(msg);
  }
}
