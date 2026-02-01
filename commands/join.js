import { joinVoiceChannel, getVoiceConnection } from '@discordjs/voice';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'join';

export const data = new SlashCommandBuilder()
  .setName('join')
  .setDescription('Присоединиться к голосовому каналу');

export async function execute(interaction) {
  const member = interaction.member;
  const voiceChannel = member?.voice?.channel;

  if (!voiceChannel) {
    const msg = awaitinteraction.reply({
      content: 'Зайди в голосовой канал',
      ephemeral: true
    });

    autoDelete(msg);
    return;
  }

  // Если уже подключены — не переподключаемся
  const existing = getVoiceConnection(interaction.guildId);
  if (existing) {
    const msg = await interaction.reply({
      content: 'Я уже в голосовом канале',
      ephemeral: true
    });
    
    autoDelete(msg);
    return;
  }

  joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: interaction.guildId,
    adapterCreator: interaction.guild.voiceAdapterCreator
  });

  const msg = await interaction.reply('Я присоединился к голосовому каналу');

  autoDelete(msg);
}
