import { getVoiceConnection } from '@discordjs/voice';
import { state } from '../state/state.js';

/**
  @param {string} guildId 
 */
export function scheduleAutoLeave(guildId) {

  if (state.autoLeaveTimeout) {
    clearTimeout(state.autoLeaveTimeout);
    state.autoLeaveTimeout = null;
  }

  state.autoLeaveTimeout = setTimeout(() => {
    const connection = getVoiceConnection(guildId);
    if (connection && state.mode === 'idle') {
      connection.destroy();
      console.log('Бот вышел из канала после 30 секунд бездействия');
    }
    state.autoLeaveTimeout = null;
  }, 30000);
}

export function cancelAutoLeave() {
  if (state.autoLeaveTimeout) {
    clearTimeout(state.autoLeaveTimeout);
    state.autoLeaveTimeout = null;
    console.log('Таймер авто-выхода отменён');
  }
}
