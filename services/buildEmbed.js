import { EmbedBuilder } from 'discord.js';

export function buildEmbed(news, index, lang = 'ru') {
  const item = news[index];
  const t = item.translations[lang] || item.translations['ru'];

  return new EmbedBuilder()
    .setTitle(t.title)                  
    .setDescription(t.text.slice(0, 3800)) 
    .setURL(item.link)
    .setFooter({ text: `Источник: ${item.source} | ${index+1}/${news.length}` })
    .setTimestamp(new Date(item.date));
}