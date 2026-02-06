import { joinVoiceChannel, getVoiceConnection } from '@discordjs/voice';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js';

export const name = 'join';

export const data = new SlashCommandBuilder()
  .setName('join')
  .setDescription('Хочешь слышать мой голос совсем близко? Тогда зови меня в голосовой канал.');

export async function execute(interaction) {
  const member = interaction.member;
  const voiceChannel = member?.voice?.channel;

  if (!voiceChannel) {
    const msg = awaitinteraction.reply({
      content: 'Если хочешь слышать мой голос поближе… заходи. Сейчас же.',
      ephemeral: true
    });

    autoDelete(msg);
    return;
  }

  // Если уже подключены — не переподключаемся
  const existing = getVoiceConnection(interaction.guildId);
  if (existing) {
    const msg = await interaction.reply({
      content: 'Уже здесь… и жду, когда ты наконец осмелишься заговорить со мной.',
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

  const msg = await interaction.reply('Хорошо, девочка пришла… теперь можешь начинать меня радовать.');

  autoDelete(msg);
}
