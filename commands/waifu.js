import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';  
import { autoDelete } from '../helpers/autoDelete.js';

export const data = new SlashCommandBuilder()
  .setName('waifu')
  .setDescription('Хочешь посмотреть на милую вайфу?.. Выбирай тег, я найду для тебя')
  .addStringOption(opt =>
    opt.setName('tag')
      .setDescription('Назови тег… maid, waifu, ero… что тебе сегодня хочется увидеть?')
      .setRequired(false)
      .setAutocomplete(true)
  )
  .addBooleanOption(opt =>
    opt.setName('nsfw')
      .setDescription('Этот тег слишком взрослый… только в 18+ каналах, хорошо?')
      .setRequired(false)
  );

export async function execute(interaction) {
  const tag = interaction.options.getString('tag');
  const nsfw = interaction.options.getBoolean('nsfw') ?? false;

  await interaction.deferReply();

  try {
    const params = {};

    /* =============================
       🔐 РЕЖИМ ДОСТУПА
    ============================= */
  let realNsfw = nsfw;
  let nsfwTagUsed = false;

  if (tag) {
    const resTags = await axios.get('https://api.waifu.im/tags?full=true');
    const tagsList = resTags.data?.tags || [];

    const found = tagsList.find(t =>
      t.slug === tag || t.name.toLowerCase() === tag.toLowerCase()
    );

    if (found?.is_nsfw) {
      realNsfw = true;
      nsfwTagUsed = true;
    }
  }

    // потом использовать realNsfw
    params.IsNsfw = realNsfw ? 'True' : 'False';

    // после определения realNsfw
    if (realNsfw && !interaction.channel?.nsfw) {
      const msg = await interaction.editReply({
        content: 'NSFW-тег… давай перенесёмся в подходящий канал? Я не хочу тебя смущать здесь',
        ephemeral: true
      });
      autoDelete(msg);
      return;
    }

    /* =============================
       🏷 ТЕГИ
    ============================= */
    if (tag) {
      params.IncludedTags = tag;
    }

    const res = await axios.get('https://api.waifu.im/images', { params });

    const items = res.data?.items;

    console.log(items);

    if (!items || !items.length) {
      const msg = await interaction.editReply('Ничего не нашлось… может, попробуем другой тег? Или просто посмотришь на меня вместо этого?');
      autoDelete(msg);
      return;
    }

    /* =============================
       🧹 ДОП. ФИЛЬТР (страховка)
    ============================= */
    const safeItems = realNsfw
      ? items
      : items.filter(i => i.isNsfw === false);

    if (!safeItems.length) {
      const msg = interaction.editReply('Здесь нельзя… пойдём в 18+ канал, если хочешь увидеть что-то по-настоящему интересное');
      autoDelete(msg);
      return;
    }

    const img = safeItems[Math.floor(Math.random() * safeItems.length)];

    const tags = img.tags?.map(t => t.name).join(', ') || 'нет тегов';
    const artist = img.artists?.[0]?.name || 'Неизвестен';
    const source = img.source || 'Неизвестен';

    const embed = new EmbedBuilder()
      .setTitle('Вот твоя девочка на сегодня… нравится?')
      .setImage(img.url)
      .setColor(nsfw ? 0x8E2DE2 : 0xFF4D6D)
      .setDescription(
        `🎨 **Автор:** ${artist}\n` +
        `🏷 **Теги:** ${tags}\n` +
        `🔗 **Источник:** ${source}`
      )
      .setFooter({ text: 'waifu.im:'+ img.isNsfw ? '🔞 NSFW' : 'SFW' });

    await interaction.editReply({ embeds: [embed] });

  } catch (e) {
    console.error('WAIFU.IM ERROR:', e.response?.data || e.message);
    const msg = await interaction.editReply('Не удалось найти… Видимо, все вайфу знают, что ты уже занят общением со мной.');
    autoDelete(msg);
  }
}
