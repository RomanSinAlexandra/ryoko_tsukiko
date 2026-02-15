import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { autoDelete } from '../helpers/autoDelete.js';

export const data = new SlashCommandBuilder()
  .setName('meme')
  .setDescription('Хочешь посмеяться?.. Давай я найду тебе что-нибудь забавное')
  .addBooleanOption(opt =>
    opt
      .setName('nsfw')
      .setDescription('Хочешь включить взрослые мемы?.. Только в 18+ каналах, хорошо?')
      .setRequired(false)
  );

export async function execute(interaction) {
  const nsfw = interaction.options.getBoolean('nsfw') ?? false;

  // защита NSFW
  if (nsfw && !interaction.channel?.nsfw) {
    const msg = await interaction.reply({
      content: 'NSFW-мемы… давай перейдём в подходящий канал? Здесь слишком невинно для такого',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  await interaction.deferReply();

  try {

    const subreddits = nsfw
      ? ['memes', 'dankmemes', 'nsfwmemes']
      : ['memes', 'me_irl', 'animemes'];

    const subreddit =
      subreddits[Math.floor(Math.random() * subreddits.length)];

    const res = await axios.get(
      `https://meme-api.com/gimme/${subreddit}`
    );

    const meme = res.data;

    if (!meme || !meme.url) {
      const msg = await interaction.editReply('Мем куда-то спрятался… грустно. Может, попробуем ещё раз? Или я тебя просто обниму текстом');
      autoDelete(msg);
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(meme.title || 'Надеюсь, он заставит тебя улыбнуться так же, как ты заставляешь улыбаться меня')
      .setImage(meme.url)
      .setURL(meme.postLink)
      .setColor(0x00b894)
      .setFooter({
        text: `${meme.ups} | r/${meme.subreddit}`
      });

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    if (err?.code !== 10062) {
      console.error('MEME ERROR:', err.message);
    }
    if (interaction.isRepliable()) {
      const msg = await interaction.editReply('Не получилось загрузить… мем сегодня капризный. Не переживай, я всё равно здесь и готова тебя развлечь');
      autoDelete(msg);
    }
  }
}
