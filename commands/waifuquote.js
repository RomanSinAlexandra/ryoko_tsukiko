import { SlashCommandBuilder } from "discord.js";
import { waifuApi } from "../helpers/waifuApi.js";

export const data = new SlashCommandBuilder()
  .setName("waifuquote")
  .setDescription("Хочешь романтичную цитату?.. Назови девочку или аниме — или просто доверься мне.")
  .addStringOption(option =>
    option
      .setName("query")
      .setDescription("Имя персонажа, аниме или просто random… давай, не томи — я уже в предвкушении.")
      .setRequired(false)
  );

export async function execute(interaction) {
  await interaction.deferReply();

  try {
    const queryRaw = interaction.options.getString("query");
    const query = queryRaw?.trim();

    let data = null;

    // 🎲 RANDOM
    if (!query || query.toLowerCase() === "random") {
      data = await waifuApi("/quote");
    } else {
      // 🔍 1️⃣ пробуем искать по аниме
      try {
        data = await waifuApi(`/quote?anime=${encodeURIComponent(query)}`);
      } catch {
        data = null;
      }

      // 🔍 2️⃣ если по аниме не нашли — пробуем по персонажу
      if (!data?.quote) {
        data = await waifuApi(`/quote?character=${encodeURIComponent(query)}`);
      }
    }

    // 🛡 Проверка результата
    if (!data?.quote) {
      return interaction.editReply("Даже цитаты стесняются сегодня… Хочешь, я скажу тебе что-нибудь лично?");
    }

    // 🧾 Формирование ответа
    let description = `“${data.quote}”`;

    if (data.author) description += `\n— **${data.author}**`;
    if (data.anime) description += `, *${data.anime}*`;

    const embed = {
      color: 0xffb6c1,
      title: query && query !== "random"
        ? `Цитата по твоему запросу… слушай внимательно: ${query}`
        : "Случайные слова… но каждое могло бы быть признанием в любви к тебе.",
      description,
      footer: { text: "Источник: waifu.it" }
    };

    await interaction.editReply({ embeds: [embed] });

  } catch (err) {
    console.error("waifuquote error:", err);

    await interaction.editReply(
      err?.data?.statusMessage ||
      "Не удалось достать цитату… Какая досада. Может, это знак, что пора услышать мой собственный текст?"
    );
  }
}
