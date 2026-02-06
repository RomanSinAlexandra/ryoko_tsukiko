import { SlashCommandBuilder } from "discord.js";
import { waifuApi } from "../helpers/waifuApi.js";

export const data = new SlashCommandBuilder()
  .setName("waifufact")
  .setDescription("Хочешь узнать что-то милое про аниме?.. Только не влюбись в чужих девочек по дороге");

export async function execute(interaction) {
  await interaction.deferReply(); // даём время на запрос

  try {
    const data = await waifuApi("/fact");

    if (!data || !data.fact) {
      return interaction.editReply("Факт куда-то спрятался… Похоже, даже факты боятся, что ты будешь думать только обо мне.");
    }

    const embed = {
      color: 0x99ccff,
      title: "Вот тебе маленький секрет из мира аниме… слушай внимательно",
      description: data.fact,
      footer: { text: "Источник: waifu.it" }
    };

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    await interaction.editReply("Ошибка… факт сегодня стесняется. Ну ничего — я могу рассказать тебе кое-что гораздо интереснее сама.");
  }
}
