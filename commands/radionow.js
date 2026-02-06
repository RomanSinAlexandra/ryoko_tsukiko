import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { state } from '../state/state.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'radionow';

export const data = new SlashCommandBuilder()
  .setName('radionow')
  .setDescription('Хочешь узнать, что сейчас звучит в моих наушниках?.. Смотри внимательно');

export async function execute(interaction) {
  if (state.mode !== 'radio' || !state.currentRadio) {
    const msg = await interaction.reply({
      content: 'Радио молчит… тишина такая уютная, когда мы вдвоём, правда?',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  const { title, url } = state.currentRadio;

  const embed = new EmbedBuilder()
    .setTitle('Сейчас играет радио… ммм, хочешь, чтобы я подпевала тебе на ушко?')
    .setColor(0x5865F2)
    .addFields(
      { name: 'Станция', value: `**${title}**` },
      { name: 'URL', value: url }
    )
    .setFooter({ text: `Запросил: ${interaction.user.tag}. Такой любопытный… нравится, когда ты интересуешься, что у меня в плеере` });

  const msg = await interaction.reply({ embeds: [embed] });
  autoDelete(msg, 60_000);
}
