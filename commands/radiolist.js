import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from 'discord.js';
import { radioStations } from '../radio/radio.js';
import { autoDelete } from '../helpers/autoDelete.js'

export const name = 'radiolist';

export const data = new SlashCommandBuilder()
  .setName('radiolist')
  .setDescription('Список всех доступных радиостанций');

export async function execute(interaction) {
  await interaction.deferReply();

  const entries = Object.entries(radioStations);

  if (!entries.length) {
    const msg = interaction.editReply('Радиостанции не найдены');
    autoDelete(msg);
    return;
  }

  const description = entries
    .map(([key, station]) => `🎵 **${station.title}**`)
    .join('\n');

  const embed = new EmbedBuilder()
    .setTitle('Доступные радиостанции')
    .setColor(0x5865F2)
    .setDescription(description);

  await interaction.editReply({ 
    embeds: [embed], 
    flags: MessageFlags.Ephemeral
  });
}
