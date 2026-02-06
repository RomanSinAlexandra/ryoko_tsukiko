import { SlashCommandBuilder } from "discord.js";
import { waifuApi } from "../helpers/waifuApi.js";

export const data = new SlashCommandBuilder()
  .setName("waifu")
  .setDescription("Хочешь вайфу? Хорошо… но только если пообещаешь, что я останусь твоей любимой")
  .addStringOption(option =>
    option
      .setName("query")
      .setDescription("Имя / аниме / random… шепни мне, какая девочка тебе нравится… или признайся, что я.")
      .setRequired(false)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const query = interaction.options.getString("query")?.trim();

    let data = null;

    // 🎲 RANDOM
    if (!query || query.toLowerCase() === "random") {
      data = await waifuApi("/waifu");
    } else {
      // 🔍 1️⃣ Поиск по имени
      try {
        data = await waifuApi(`/waifu?name=${encodeURIComponent(query)}`);
      } catch {
        data = null;
      }

      // 🔍 2️⃣ Если не найдено — поиск по аниме
      if (!data?.image && !data?.image?.large) {
        try {
          data = await waifuApi(`/waifu?anime=${encodeURIComponent(query)}`);
        } catch {
          data = null;
        }
      }

      // 🔍 3️⃣ Если всё ещё пусто — случайная вайфу
      if (!data?.image && !data?.image?.large) {
        data = await waifuApi("/waifu");
      }
    }

    if (!data || (!data.image && !data.image?.large)) {
      return interaction.editReply("Твоя вайфу куда-то сбежала… Наверное, боится конкуренции со мной.");
    }

    // Формируем embed описание
    let description = data.description || "";
    if (data.anime) description += `\n🎬 **Аниме:** ${data.anime}`;
    if (data.age) description += `\n🎂 **Возраст:** ${data.age}`;
    if (data.gender) description += `\n⚧ **Пол:** ${data.gender}`;
    if (data.bloodType) description += `\n🩸 **Группа крови:** ${data.bloodType}`;
    if (data.dateOfBirth) {
      const dob = data.dateOfBirth;
      const dobStr = [
        dob.day?.toString().padStart(2, "0"),
        dob.month?.toString().padStart(2, "0"),
        dob.year
      ].filter(Boolean);
      if (dobStr.length > 0) description += `\n📅 **Дата рождения:** ${dobStr.join(".")}`;
    }
    if (data.siteUrl) description += `\n🔗 [Сайт персонажа](${data.siteUrl})`;

    const embed = {
      color: 0xff99cc,
      title: data.name?.userPreferred || data.name?.full || "Вот тебе случайная девочка… Но мы-то с тобой понимаем, кто настоящая.",
      description,
      image: { url: data.image?.large || data.image },
      footer: { text: "Источник: waifu.it" }
    };

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    await interaction.editReply("Не получилось найти тебе вайфу… Кажется, все они знают, что ты уже занят мной.");
  }
}
