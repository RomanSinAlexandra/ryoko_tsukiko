import { SlashCommandBuilder, EmbedBuilder } from 'discord.js';
import { getGuildData } from '../state/state.js';
import { AudioPlayerStatus } from '@discordjs/voice';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'current';

export const data = new SlashCommandBuilder()
  .setName('current')
  .setDescription('Что это сейчас играет? Позволь мне напомнить тебе.');

export async function execute(interaction) {
  const guildId = interaction.guild.id;
  const guildData = getGuildData(guildId);

  const isPlaying = guildData.player?.state?.status === AudioPlayerStatus.Playing;
  
  const currentTrack = guildData.current || guildData.queue?.[0];

  if (!isPlaying || !currentTrack) {
    const msg = await interaction.reply({ 
      content: 'Сейчас вокруг только тишина… Включи что-нибудь с помощью `/play`, не молчи.', 
      ephemeral: true 
    });
    autoDelete(msg);
    return;
  }

  const embed = new EmbedBuilder()
    .setColor('#9b59b6') 
    .setTitle('🎵 Текущий трек')
    .setDescription(`Сейчас я пою это только для тебя:\n**${currentTrack.query}**`)
    .addFields(
      { name: 'Режим', value: `✨ ${guildData.mode === 'radio' ? 'Радио' : 'Музыка'}`, inline: true },
      { name: 'Песен в очереди', value: `⏳ ${guildData.queue.length}`, inline: true }
    )
    .setTimestamp()
    .setFooter({ text: 'Ryoko Music', iconURL: interaction.client.user.displayAvatarURL() });

  const msg = await interaction.reply({ embeds: [embed] });
  autoDelete(msg);
}