import { createAudioPlayer } from '@discordjs/voice';

// Хранилище: ключ - ID сервера, значение - объект с данными сервера
const servers = new Map();

export function getGuildData(guildId) {
  // Если для этого сервера еще нет данных — создаем их
  if (!servers.has(guildId)) {
    const player = createAudioPlayer();
    
    // Ошибки плеера вешаем сразу при создании
    player.on('error', error => {
      console.error(`❌ Ошибка аудио-плеера на сервере ${guildId}:`, error.message);
    });

    servers.set(guildId, {
      player: player,
      queue: [],
      mode: 'idle', // 'idle' | 'music' | 'radio'
      autoLeaveTimeout: null,
      playNextTimeout: null // Перенесли таймер из playNext сюда
    });
  }
  
  return servers.get(guildId);
}

// Если бот выходит, можно очистить память (по желанию)
export function deleteGuildData(guildId) {
  servers.delete(guildId);
}