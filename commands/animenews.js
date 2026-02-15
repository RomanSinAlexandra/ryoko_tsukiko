import { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import axios from 'axios';
import xml2js from 'xml2js';
import cron from 'node-cron';

const RSS_SOURCES = {
  ann: 'https://www.animenewsnetwork.com/all/rss.xml',
  mal: 'https://myanimelist.net/news/rss.xml',
  crunch: 'https://www.crunchyroll.com/rss/anime',
  japanTimes: 'https://www.japantimes.co.jp/culture/anime/feed/'
};

const DAILY_HOUR = 17; // 12:00 по серверу
const NEWS_LIMIT = 5; // максимум новостей с источника

// 🔹 Функция перевода через Google Translate endpoint
async function translateRU(text) {
  try {
    const res = await axios.post('https://translate.googleapis.com/translate_a/single', null, {
      params: { client: 'gtx', sl: 'en', tl: 'ru', dt: 't', q: text }
    });
    return res.data[0].map(t => t[0]).join('');
  } catch {
    return 'Ошибка перевода… даже новости сегодня капризничают. Не переживай, я всё равно расскажу тебе главное';
  }
}

// 🔹 Функция получения новостей из RSS
async function fetchRSS(url, limit = 5) {
  try {
    const res = await axios.get(url);
    const xml = res.data;
    const parsed = await xml2js.parseStringPromise(xml);
    let items = parsed?.rss?.channel?.[0]?.item || [];

    // фильтруем за последние 24 часа
    const now = new Date();
    items = items.filter(i => now - new Date(i.pubDate?.[0]) <= 24 * 60 * 60 * 1000);
    return items.slice(0, limit).map(i => ({
      title: i.title?.[0] || 'Новости \nВот что интересного произошло в мире аниме сегодня',
      link: i.link?.[0],
      en: (i.description?.[0] || '').replace(/<[^>]+>/g, '').slice(0, 800),
      date: i.pubDate?.[0]
    }));
  } catch (err) {
    console.error('RSS FETCH ERROR:', err.message);
    return [];
  }
}

// 🔹 Создаем embed с RU + EN
async function buildEmbed(news, index = 0) {
  const ruText = await translateRU(news[index].en);
  return new EmbedBuilder()
    .setTitle(`📰 ${news[index].title}`)
    .setURL(news[index].link)
    .setDescription(`🇷🇺 Русский:\n${ruText}\n\n🇺🇸 Original:\n${news[index].en}`)
    .addFields({ name: '📅 Свеженькое, только для тебя', value: news[index].date || 'N/A' })
    .setFooter({ text: `${index + 1}/${news.length} • Anime News самое интересное, что я нашла… смотри, не пропусти ничего милого` })
    .setColor(0x00BFFF);
}

// 🔹 Кнопки карусели
function buildButtons() {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('prev').setLabel('⬅️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('next').setLabel('➡️').setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId('refresh').setLabel('🔄').setStyle(ButtonStyle.Primary)
  );
}

// 🔹 Основная функция автопоста
export async function autoPost(client, channelId) {
  try {
    const channel = await client.channels.fetch(channelId);
    if (!channel?.isTextBased()) return console.error('Канал не найден… или он не текстовый. \nДавай выберем правильный канал, чтобы новости приходили к тебе красиво');

    // 🔹 Удаляем старые сообщения бота в этом канале
    const messages = await channel.messages.fetch({ limit: 50 }); // проверяем последние 50 сообщений
    const botMessages = messages.filter(m => m.author.id === client.user.id);
    for (const [id, msg] of botMessages) {
      try {
        await msg.delete();
      } catch {}
    }

    let allNews = [];

    for (const key of Object.keys(RSS_SOURCES)) {
      const news = await fetchRSS(RSS_SOURCES[key], NEWS_LIMIT);
      if (news.length) {
        allNews.push(...news.map(n => ({ ...n, source: key.toUpperCase() })));
      }
    }

    if (!allNews.length) return console.log('За последние сутки ничего нового… \nАниме-индустрия взяла паузу. Может, это знак, чтобы мы с тобой просто поболтали?');

    // 🔹 публикуем первую новость с каруселью
    let index = 0;
    const msg = await channel.send({
      embeds: [await buildEmbed(allNews, index)],
      components: [buildButtons()]
    });

    const collector = msg.createMessageComponentCollector({ time: 6 * 60 * 60 * 1000 });

    collector.on('collect', async btn => {
      if (btn.customId === 'next') index = (index + 1) % allNews.length;
      if (btn.customId === 'prev') index = (index - 1 + allNews.length) % allNews.length;
      if (btn.customId === 'refresh') index = 0;
      await btn.update({ embeds: [await buildEmbed(allNews, index)], components: [buildButtons()] });
    });

    collector.on('end', async () => {
      try { await msg.edit({ components: [] }); } catch {}
    });

    console.log(`✅ Опубликовано ${allNews.length} новостей в канал ${channelId} Всё аккуратно разложено… теперь твои подписчики в курсе. Молодец, что следишь за этим`);
  } catch (err) {
    console.error('AUTO-POST ERROR:', err);
  }
}

// 🔹 CRON для ежедневного запуска
export function scheduleDaily(client, channelId) {
  cron.schedule(`0 ${DAILY_HOUR} * * *`, () => {
    console.log('🕛 Запуск ежедневного дайджеста новостей... Скоро канал наполнится свежими новостями. Я обо всём позабочусь.');
    autoPost(client, channelId);
  });
}