import { radioStations } from '../radio/radio.js';
import { searchAnime } from '../helpers/kitsu.js';
import fetch from 'node-fetch';
import axios from 'axios';

export async function handleAutocomplete(interaction, client) {
  try {
    if (!interaction.isAutocomplete()) return;

    const focusedOption = interaction.options.getFocused(true);
    const value = (focusedOption.value ?? '').toLowerCase();

    /* ================= RADIO ================= */
    if (interaction.commandName === 'radio' && focusedOption.name === 'station') {
      const choices = Object.entries(radioStations)
        .map(([key, station]) => ({
          name: station.title,
          value: key
        }))
        .filter(choice => choice.name.toLowerCase().includes(value))
        .slice(0, 25);

      return await interaction.respond(choices);
    }

    /* ================= RYOKO ================= */
    if (interaction.commandName === 'ryoko' && focusedOption.name === 'category') {
      const res = await fetch('http://localhost:3000/api/categories');
      const categories = await res.json();

      const choices = categories
        .filter(cat => cat.toLowerCase().includes(value))
        .slice(0, 25)
        .map(cat => ({
          name: cat,
          value: cat
        }));

      return await interaction.respond(choices);
    }

    /* ================= ANIME ================= */
    if (interaction.commandName === 'anime' && focusedOption.name === 'title') {
      try {
        const results = await searchAnime(value);

        const choices = results.slice(0, 10).map(anime => ({
          name: anime.title.length > 100
            ? anime.title.slice(0, 97) + '…'
            : anime.title,
          value: anime.title
        }));

        return await interaction.respond(choices);
      } catch (err) {
        console.error('Anime autocomplete error:', err);
        return await interaction.respond([]);
      }
    }

    /* ================= R34 ================= */
    if (interaction.commandName === 'r34' && focusedOption.name === 'tags') {
      const focused = interaction.options.getFocused();
      const tags = focused.split(' ');
      const lastTag = tags.pop();

      const res = await axios.get('https://api.rule34.xxx/autocomplete.php', {
        params: {
          q: lastTag,
          user_id: process.env.USERID || '',
          api_key: process.env.API || ''
        }
      });

      const suggestions = Array.isArray(res.data)
        ? res.data.slice(0, 25).map(item => {
            const tag = item.value || item;
            const fullValue = [...tags, tag].join(' ');
            return {
              name: fullValue,
              value: fullValue
            };
          })
        : [];

      return await interaction.respond(suggestions);
    }

    /* ================= CHARACTER ================= */
    if (interaction.commandName === 'character') {
      const focused = interaction.options.getFocused(true);
      const value = focused.value;

      try {
        // 🔹 автопоиск персонажей
        if (focused.name === 'name') {
          const res = await axios.get(
            `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(value)}&limit=15`
          );

          const choices = res.data.data.map(c => {
            const name = c.name || 'Unknown';

            const safe = name.length > 100
              ? name.slice(0, 97) + '...'
              : name;

            return {
              name: safe,
              value: safe   // value тоже ≤ 100
            };
          });

          return interaction.respond(choices.slice(0, 10));
        }

        // 🔹 автопоиск аниме
        if (focused.name === 'anime') {
          const res = await axios.get(
            `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(value)}&limit=15`
          );

          const choices = res.data.data.map(a => {
            const title = a.title || 'Unknown';

            const safe = title.length > 100
              ? title.slice(0, 97) + '...'
              : title;

            return {
              name: safe,
              value: safe
            };
          });

          return interaction.respond(choices.slice(0, 10));
        }

      } catch (e) {
        console.error('Autocomplete error:', e.message);
        return interaction.respond([]);
      }
    }

    /* ================= WAIFU ================= */
    if (interaction.commandName === 'waifu' && focusedOption.name === 'tag') {
      const focused = interaction.options.getFocused()?.toLowerCase() || '';

          try {
            const res = await axios.get('https://api.waifu.im/tags?');
            
            const tags = res.data?.items || []; 
            
            if (!tags.length) {
              return interaction.respond([]);
            }
            
            const nsfw = interaction.options.getBoolean('nsfw') ?? false;

            const filtered = tags
              .filter(t => {
                if (!nsfw && t.is_nsfw) return false; // скрыть NSFW теги
                return t.name.toLowerCase().includes(focused);
              })
              .slice(0, 25);
            
            return interaction.respond(
              filtered.map(t => ({
                name: `${t.name}${t.is_nsfw ? ' 🔞' : ''}`,
                value: t.slug || t.name.toLowerCase()
              }))
            );
          
          } catch (e) {
            console.error('WAIFU AUTOCOMPLETE ERROR:', e.response?.data || e.message);
            return interaction.respond([]);
          }
    }

    /* ================= characterart  ================= */
    if (interaction.commandName === 'characterart' && focusedOption.name === 'tags') {
      const focused = interaction.options.getFocused(true);
      if (focused.name !== 'tags') return;

      const input = focused.value.toLowerCase();
      const rating = interaction.options.getString('rating'); // s | q | e

      try {
        const url = 'https://danbooru.donmai.us/tags.json?' + new URLSearchParams({
          'search[name_matches]': `${input}*`,
          'search[order]': 'count',
          limit: 50
        });

        const res = await axios.get(url);
        if (!Array.isArray(res.data)) {
          return interaction.respond([]);
        }

        let tags = res.data;

        // 🔞 если выбран SFW — фильтруем NSFW теги
        if (rating === 's') {
          tags = tags.filter(tag =>
            tag.post_count > 0 &&
            !tag.name.includes('sex') &&
            !tag.name.includes('nude') &&
            !tag.name.includes('nsfw') &&
            !tag.name.includes('penis') &&
            !tag.name.includes('vagina')
          );
        }

        const suggestions = tags.slice(0, 25).map(tag => ({
          name: `${tag.name} (${tag.post_count})`,
          value: tag.name 
        }));

        return await interaction.respond(suggestions);

      } catch (e) {
        console.error('AUTOCOMPLETE ERROR:', e.message);
        return await interaction.respond([]);
      }
    }

    // fallback
    return await interaction.respond([]);

  } catch (err) {
    console.error('AUTOCOMPLETE ERROR:', err);
    if (!interaction.responded) {
      await interaction.respond([]);
    }
  }
}
