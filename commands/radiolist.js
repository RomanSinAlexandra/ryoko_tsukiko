import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { radioStations } from '../radio/radio.js';
import { autoDelete } from '../helpers/autoDelete.js'

export const name = 'radiolist';

export const data = new SlashCommandBuilder()
  .setName('radiolist')
  .setDescription('Хочешь посмотреть, какие мелодии я готова для тебя включить?');

export async function execute(interaction) {
  await interaction.deferReply();

  const entries = Object.entries(radioStations);

  if (!entries.length) {
    const msg = interaction.editReply('Радиостанций нет… Ох, даже музыка сегодня стесняется перед тобой. Может, просто послушаем тишину вдвоём?');
    autoDelete(msg);
    return;
  }

  const description = entries
    .map(([key, station]) => `**${station.title}**`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setTitle('Смотри внимательно — каждая из них может стать нашей маленькой тайной на сегодня')
    .setColor(0x5865F2)
    .setDescription(description);

  await interaction.editReply({ 
    embeds: [embed], 
    flags: MessageFlags.Ephemeral
  });
}
