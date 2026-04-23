import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';

export function buildButtons() {
  const navRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('prev')
      .setLabel('⬅️')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('next')
      .setLabel('➡️')
      .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
      .setCustomId('refresh')
      .setLabel('🔄')
      .setStyle(ButtonStyle.Secondary)
  );

  const langRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('lang_ru')
      .setLabel('🇷🇺 RU')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('lang_en')
      .setLabel('🇺🇸 EN')
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId('lang_jp')
      .setLabel('🇯🇵 JP')
      .setStyle(ButtonStyle.Primary)
  );

  return [navRow, langRow];
}