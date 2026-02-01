import { radioStations } from '../radio/radio.js';

export async function handleAutocomplete(interaction) {
  try {
    if (!interaction.isAutocomplete()) return;

    const focused = interaction.options.getFocused(true);

    if (
      interaction.commandName !== 'radio' ||
      focused.name !== 'station'
    ) return;

    const value = (focused.value ?? '').toLowerCase();

    const choices = Object.entries(radioStations)
      .map(([key, station]) => ({
        name: station.title,
        value: key
      }))
      .filter(choice =>
        choice.name.toLowerCase().includes(value)
      )
      .slice(0, 25); 

    await interaction.respond(choices);
  } catch (err) {
    console.error('AUTOCOMPLETE ERROR:', err);

    if (!interaction.responded) {
      await interaction.respond([]);
    }
  }
}
