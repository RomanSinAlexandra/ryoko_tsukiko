import { searchAnime } from './kitsu.js';

export async function animeAutocomplete(interaction) {
  const focused = interaction.options.getFocused();
  if (!focused) return;

  const results = await searchAnime(focused, 10);

  await interaction.respond(
    results.map(a => ({
      name: a.title.slice(0, 100),
      value: a.title
    }))
  );
}
