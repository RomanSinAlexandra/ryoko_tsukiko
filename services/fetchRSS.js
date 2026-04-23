import axios from 'axios';
import xml2js from 'xml2js';

export async function fetchRSS(url, limit = 5) {
  try {
    const res = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (AnimeBot/1.0; +https://discordapp.com)'
      },
      timeout: 15000
    });

    const xml = res.data;
    const parsed = await xml2js.parseStringPromise(xml);
    let items = parsed?.rss?.channel?.[0]?.item || [];

    const now = new Date();
    items = items.filter(i => {
      const date = new Date(i.pubDate?.[0]);
      return !isNaN(date) && now - date <= 24 * 60 * 60 * 1000;
    });

    return items.slice(0, limit).map(i => ({
      title: i.title?.[0] || 'News',
      link: i.link?.[0],
      en: (i.description?.[0] || '').replace(/<[^>]+>/g, '').slice(0, 800),
      date: i.pubDate?.[0]
    }));

  } catch (err) {
    console.error('RSS FETCH ERROR:', url, err.response?.status || err.message);
    return [];
  }
}