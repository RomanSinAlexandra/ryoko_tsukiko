import { radioStations } from '../radio/radio.js';
import fetch from 'node-fetch';

export async function handleAutocomplete(interaction) {
  try {
    if (!interaction.isAutocomplete()) return;

    const focused = interaction.options.getFocused(true);
    const value = (focused.value ?? '').toLowerCase();

    if (
      interaction.commandName === 'radio' &&
      focused.name === 'station'
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
          focused.name === 'category'
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

  } catch (err) {
    console.error('AUTOCOMPLETE ERROR:', err);

    if (!interaction.responded) {
      await interaction.respond([]);
    }
  }
}
