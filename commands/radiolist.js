import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { radioStations } from '../radio/radio.js';
import { autoDelete } from '../helpers/autoDelete.js'

export const name = 'radiolist';

export const data = new SlashCommandBuilder()
  .setName('radiolist')
  .setDescription('Хочешь посмотреть, какие мелодии я готова для тебя включить?');

export async function execute(interaction) {
  // Используем обычный reply, если список небольшой
  const entries = Object.entries(radioStations);

  if (!entries.length) {
    const msg = await interaction.reply('Радиостанций нет… Может, просто послушаем тишину вдвоём?');
    autoDelete(msg);
    return;
  }

  const description = entries
    .map(([key, station]) => `• **${station.title}**`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setTitle('Смотри внимательно — каждая из них может стать нашей маленькой тайной')
    .setColor(0x5865F2)
    .setDescription(description);

  // Отправляем эфемерно, чтобы не засорять чат всем
  await interaction.reply({ 
    embeds: [embed], 
    flags: MessageFlags.Ephemeral
  });
}