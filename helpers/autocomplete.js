import { radioStations } from '../radio/radio.js';
import fetch from 'node-fetch';
import axios from 'axios';

export async function handleAutocomplete(interaction) {
  try {
    if (!interaction.isAutocomplete()) return;

    const focusedOption = interaction.options.getFocused(true);
    const value = (focusedOption.value ?? '').toLowerCase();

    if (
      interaction.commandName === 'radio' &&
      focusedOption.name === 'station'
    ) {
      const choices = Object.entries(radioStations)
        .map(([key, station]) => ({
          name: station.title,
          value: key
        }))
        .filter(choice =>
          choice.name.toLowerCase().includes(value)
        )
        .slice(0, 25);

      return interaction.respond(choices);
    }

    if (
      interaction.commandName === 'ryoko' &&
      focusedOption.name === 'category'
    ) {
      const res = await fetch('http://localhost:3000/api/categories');
      const categories = await res.json();

      const choices = categories
        .filter(cat => cat.toLowerCase().includes(value))
        .slice(0, 25)
        .map(cat => ({
          name: cat,
          value: cat
        }));

      return interaction.respond(choices);
    }

    if (interaction.commandName === 'anime') {
      const focused = interaction.options.getFocused();
      if (!focused) return interaction.respond([]);

      const results = await searchAnime(focused, 10);

      return interaction.respond(
        results.map(a => ({
          name: a.title.slice(0, 100),
          value: a.title
        }))
      );
    }

    if (
      interaction.commandName === 'r34' &&
      focusedOption.name === 'tags'
    ) {
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
            const valueTag = item.value || item;
            const fullValue = [...tags, valueTag].join(' ');
            return {
              name: fullValue,
              value: fullValue
            };
          })
        : [];

      return interaction.respond(suggestions);
    }

    return interaction.respond([]);

  } catch (err) {
    console.error('AUTOCOMPLETE ERROR:', err);
    if (!interaction.responded) {
      await interaction.respond([]);
    }
  }
}
