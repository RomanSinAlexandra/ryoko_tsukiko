import { createAudioPlayer } from '@discordjs/voice';

// Общий AudioPlayer для всего бота
export const player = createAudioPlayer();

// Очередь для музыки
export const queue = [];

// Режим воспроизведения: 'idle' | 'music' | 'radio'
export const state = {
  mode: 'idle'
};

// Функции для удобного доступа
export function getPlayer() {
  return player;
}

export function getQueue() {
  return queue;
}

export function getState() {
  return state;
}

export function setMode(mode) {
  state.mode = mode;
}

player.on('error', error => {
  console.error('❌ Ошибка аудио-плеера:', error.message);
  if (error.resource && error.resource.metadata) {
    console.error('На ресурсе:', error.resource.metadata);
  }
});