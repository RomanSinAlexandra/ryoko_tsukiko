import { getPlayer, getQueue, state, setMode } from '../state/state.js';
import { scheduleAutoLeave } from '../helpers/autoLeave.js';
import { getVoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { SlashCommandBuilder } from 'discord.js';
import { autoDelete } from '../helpers/autoDelete.js'

export const name = 'stop';

export const data = new SlashCommandBuilder()
  .setName('stop')
  .setDescription('Остановить музыку');

export async function execute(interaction) {
  const player = getPlayer();
  const queue = getQueue();

  if (!player || (state.mode === 'idle' && queue.length === 0)) {
    const msg = interaction.reply({
      content: 'Сейчас ничего не воспроизводится',
      ephemeral: true
    });
    autoDelete(msg);
    return;
  }

  player.stop();

  queue.length = 0;

  setMode('idle');

  const msg = await interaction.reply('⏹Воспроизведение остановлено');

  const connection = getVoiceConnection(interaction.guildId);
  if (connection) {
    setTimeout(() => {

      if (state.mode === 'idle' && connection.state.status !== VoiceConnectionStatus.Destroyed) {
        connection.destroy();
      }
    }, 30000);
  }

  autoDelete(msg);
  
  scheduleAutoLeave(interaction.guildId);
}
