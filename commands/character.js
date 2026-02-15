import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'character';

export const data = new SlashCommandBuilder()
  .setName('character')
  .setDescription('Хочешь найти кого-то из аниме?.. Назови имя или сериал, я помогу')
  .addStringOption(opt =>
    opt.setName('name')
      .setDescription('Имя персонажа… или название аниме. Что ищем сегодня?')
      .setRequired(false)
      .setAutocomplete(true)
  )
  .addStringOption(opt =>
    opt.setName('anime')
      .setDescription('Название аниме… давай, шепни мне, кого ты хочешь увидеть')
      .setRequired(false)
      .setAutocomplete(true)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  const charName = interaction.options.getString('name');
  const animeName = interaction.options.getString('anime');

  if (!charName && !animeName) {
    const msg = await interaction.editReply('Нужно имя персонажа или аниме… без этого я не смогу тебя порадовать');
    autoDelete(msg);
    return;
  }

  try {

    /* ===============================
       🔎 ПОИСК ТОЛЬКО ПО АНИМЕ
    =============================== */
    if (!charName && animeName) {
      const animeRes = await axios.get(
        `https://api.jikan.moe/v4/anime?q=${encodeURIComponent(animeName)}&limit=1`
      );

      const anime = animeRes.data.data[0];
      if (!anime) {
        const msg = interaction.editReply('Такого аниме я не нашла… может, опечатка? Попробуй ещё раз');
        autoDelete(msg);
        return;
      }

      const charsRes = await axios.get(
        `https://api.jikan.moe/v4/anime/${anime.mal_id}/characters`
      );

      const characters = charsRes.data.data.slice(0, 5);

      const embed = new EmbedBuilder()
        .setTitle(`Персонажи из "${anime.title}"... Смотри, сколько интересных ребят там есть`)
        .setDescription(
          characters.map(c => `• **${c.character.name}** (${c.role})`).join('\n')
        )
        .setImage(anime.images?.jpg?.image_url || null)
        .setColor(0x3498db);

      return interaction.editReply({ embeds: [embed] });
    }

    /* ===============================
       🔎 ПОИСК ТОЛЬКО ПО ПЕРСОНАЖУ
    =============================== */
    if (charName && !animeName) {
      const res = await axios.get(
        `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(charName)}&limit=1`
      );

      const char = res.data.data[0];
      if (!char){ 
        const msg = await interaction.editReply('Персонажа не нашла… он прячется от меня? Давай попробуем другое имя');
        autoDelete(msg);
        return;
      } 

      const full = await axios.get(`https://api.jikan.moe/v4/characters/${char.mal_id}/full`);
      const data = full.data.data;

      const embed = new EmbedBuilder()
        .setTitle(data.name)
        .setURL(data.url)
        .setDescription(data.about?.slice(0, 500) || 'Описания нет… зато внешность у него точно запоминающаяся, правда?')
        .setImage(data.images?.jpg?.image_url || null)
        .setColor(0xe67e22)
        .addFields({
          name: '🎬 Аниме',
          value: data.anime?.slice(0, 5).map(a => `• ${a.anime.title}`).join('\n') || 'Ничего не нашлось… грустно. Может, поищем кого-то другого вместе?'
        });

      return interaction.editReply({ embeds: [embed] });
    }

    /* ===============================
      🔎 ПОИСК ПО ПЕРСОНАЖУ + АНИМЕ
    =============================== */
    if (charName && animeName) {
      const charRes = await axios.get(
        `https://api.jikan.moe/v4/characters?q=${encodeURIComponent(charName)}&limit=10`
      );

      if (!charRes.data.data.length) {
        const msg = await interaction.editReply('→Персонажа не нашлось… грустно.\n Видимо, он прячется от моих глаз.\n Хочешь, поищем кого-то другого вместе?');
        autoDelete(msg);
        return;
      }

      let matchedFull = null;

      // проверяем каждого персонажа через /full
      for (const c of charRes.data.data) {
        try {
          const full = await axios.get(
            `https://api.jikan.moe/v4/characters/${c.mal_id}/full`
          );

          const data = full.data.data;

          const foundAnime = data.anime?.find(a =>
            a.anime.title.toLowerCase().includes(animeName.toLowerCase())
          );

          if (foundAnime) {
            matchedFull = { data, foundAnime };
            break;
          }

        } catch (e) {
          // просто пропускаем если один упал
        }
      }

      if (!matchedFull) {
        const msg = await interaction.editReply(
          'В этом аниме такого персонажа нет… может, ты имел в виду другой сериал?'
        );
        autoDelete(msg);
        return;
      }

      const { data, foundAnime } = matchedFull;

      const embed = new EmbedBuilder()
        .setTitle(data.name)
        .setURL(data.url)
        .setDescription(data.about?.slice(0, 500) || 'Описания нет… но выглядит он точно интересно 😌')
        .setImage(data.images?.jpg?.image_url || null)
        .setColor(0x9b59b6)
        .addFields(
          { name: '🎬 Аниме', value: foundAnime.anime.title, inline: true },
          { name: '🧩 Роль', value: foundAnime.role || 'Не указано', inline: true }
        );

      return interaction.editReply({ embeds: [embed] });
    }

  } catch (err) {
    console.error('Character command error:', err);
    const msg = await interaction.editReply('Что-то пошло не так… не переживай, я разберусь. Попробуй ещё разок?');
    autoDelete(msg);
  }
}

