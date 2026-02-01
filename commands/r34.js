import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { XMLParser } from 'fast-xml-parser';
import { autoDelete } from '../helpers/autoDelete.js';

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});

export const name = 'r34';

export const data = new SlashCommandBuilder()
  .setName('r34')
  .setDescription('Поиск арта rule34')
  .addStringOption(opt =>
    opt
      .setName('tags')
      .setDescription('Теги для поиска')
      .setRequired(true)
  );

export async function execute(interaction) {
  if (!interaction.channel?.nsfw) {
    const msg = interaction.reply({
      content: 'Команда доступна только в NSFW-каналах.',
      ephemeral: true
    });

    autoDelete(msg);
    return;
  }

  const tags = interaction.options.getString('tags').trim();
  await interaction.deferReply();

  try {
    const params = {
      page: 'dapi',
      s: 'post',
      q: 'index',
      tags,
      limit: 100,
      user_id: process.env.USERID,
      api_key: process.env.API
    };

    const url =
      'https://api.rule34.xxx/index.php?' +
      new URLSearchParams(params).toString();

    const response = await axios.get(url);
    const data = parser.parse(response.data);

    if (!data.posts?.post) {
      const msg = interaction.editReply('Ничего не найдено.');
      autoDelete(msg);
      return;
    }

    const posts = Array.isArray(data.posts.post)
      ? data.posts.post
      : [data.posts.post];

    const valid = posts.filter(
      p => p['@_file_url'] && !p['@_file_url'].endsWith('.webm')
    );

    if (!valid.length) {
      const msg = interaction.editReply('Ничего не найдено.');
      autoDelete;
      return;
    }

    const post = valid[Math.floor(Math.random() * valid.length)];

    const embed = new EmbedBuilder()
      .setTitle('🔞 Rule34')
      .setDescription(`Теги: **${tags}**`)
      .setColor(0xFF0000)
      .setImage(post['@_file_url'])
      .setFooter({ text: `ID поста: ${post['@_id']}` });

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    const msg = await interaction.editReply('Ошибка при обращении к API.');
    autoDelete(msg);
  }
}
