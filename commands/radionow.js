import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getGuildData } from '../state/state.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'radionow';

export const data = new SlashCommandBuilder()
  .setName('radionow')
  .setDescription('Хочешь узнать, что сейчас звучит в моих наушниках?');

export async function execute(interaction) {
  const guildData = getGuildData(interaction.guildId);

  if (guildData.mode !== 'radio' || !guildData.currentRadio) {
    const msg = await interaction.reply({
      content: 'Радио молчит… тишина такая уютная, когда мы вдвоём, правда?',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  const { title, url } = guildData.currentRadio;

  const embed = new EmbedBuilder()
    .setTitle('Сейчас играет радио… ммм, хочешь, чтобы я подпевала тебе на ушко?')
    .setColor(0x5865F2)
    .addFields(
      { name: 'Станция', value: `**${title}**` },
      { name: 'URL', value: url }
    )
    .setFooter({ text: `Запросил: ${interaction.user.tag}.` });

  const msg = await interaction.reply({ embeds: [embed] });
  autoDelete(msg, 60_000);
}