import { getVoiceConnection } from '@discordjs/voice';
import { getGuildData } from '../state/state.js';

export function scheduleAutoLeave(guildId) {
  const guildData = getGuildData(guildId);

  if (guildData.autoLeaveTimeout) {
    clearTimeout(guildData.autoLeaveTimeout);
  }

  guildData.autoLeaveTimeout = setTimeout(() => {
    const connection = getVoiceConnection(guildId);
    if (connection && guildData.mode === 'idle') {
      connection.destroy();
      console.log(`🤖 Рёко покинула сервер ${guildId} из-за скуки.`);
    }
    guildData.autoLeaveTimeout = null;
  }, 30000); 
}

export function cancelAutoLeave(guildId) {
  const guildData = getGuildData(guildId);
  if (guildData.autoLeaveTimeout) {
    clearTimeout(guildData.autoLeaveTimeout);
    guildData.autoLeaveTimeout = null;
  }
}