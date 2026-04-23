import { RSS_SOURCES, NEWS_LIMIT } from './rssSources.js';
import { buildButtons } from './newsUI.js';
import { fetchRSS } from './fetchRSS.js'
import { translate } from './translator.js';
import { buildEmbed } from './buildEmbed.js'
import { userLangState } from '../state/languageState.js'

export async function autoPost(client, channelId) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) return console.error('Канал не найден или не текстовый');

    const messages = await channel.messages.fetch({ limit: 50 });
    const botMessages = messages.filter(m => m.author.id === client.user.id);
    for (const [id, msg] of botMessages) {
      try {
        await msg.delete();
      } catch {}
    }

    let allNews = [];

    for (const key of Object.keys(RSS_SOURCES)) {
      const news = await fetchRSS(RSS_SOURCES[key], NEWS_LIMIT);

      for (const n of news) {
        const translations = {};

        // переводим для всех языков сразу
        for (const lang of ['ru', 'en', 'ja']) {
          translations[lang] = {
            title: await translate(n.title, lang),
            text: await translate(n.en, lang)
          };
        }

        allNews.push({
          ...n,
          translations,
          source: key.toUpperCase()
        });
      }
    }

    if (!allNews.length) return console.log('Нет новых новостей за последние 24 часа');

    let index = 0;
    const channelKey = channelId;
    userLangState.set(channelKey, 'en');

    const msg = await channel.send({
      embeds: [await buildEmbed(allNews, index, 'en')],
      components: buildButtons()
    });

    const collector = msg.createMessageComponentCollector({ time: 6 * 60 * 60 * 1000 });

    collector.on('collect', async btn => {
      await btn.deferUpdate();

      let lang = userLangState.get(channelKey) || 'ru';

      if (btn.customId === 'lang_ru') lang = 'ru';
      if (btn.customId === 'lang_en') lang = 'en';
      if (btn.customId === 'lang_jp') lang = 'ja';

      userLangState.set(channelKey, lang);

      if (btn.customId === 'next') index = (index + 1) % allNews.length;
      if (btn.customId === 'prev') index = (index - 1 + allNews.length) % allNews.length;
      if (btn.customId === 'refresh') index = 0;

      const embed = buildEmbed(allNews, index, lang);

      await btn.editReply({ embeds: [embed], components: buildButtons() });
    });

    collector.on('end', async () => {
      try { await msg.edit({ components: [] }); } catch {}
    });

    console.log(`✅ Опубликовано ${allNews.length} новостей в канал ${channelId}`);
  } catch (err) {
    console.error('AUTO-POST ERROR:', err);
  }
}
