import cron from 'node-cron';
import { AnimeNewsConfig } from '../models/AnimeNewsConfig.js';
import { autoPost } from './autoPost.js';

const jobs = new Map(); // guildId -> cron task

export async function initAnimeNewsScheduler(client) {
  console.log('🕒 Инициализация планировщика новостей...');

  const configs = await AnimeNewsConfig.find({ enabled: true });

  for (const cfg of configs) {
    scheduleGuild(client, cfg);
  }
}

/* -------- создание задачи -------- */
export function scheduleGuild(client, cfg) {
  const { guildId, channelId, hour, minute } = cfg;

  // если задача уже есть — удалить
  if (jobs.has(guildId)) {
    jobs.get(guildId).stop();
    jobs.delete(guildId);
  }

  const cronTime = `${minute} ${hour} * * *`;

  const task = cron.schedule(cronTime, async () => {
    console.log(`📰 Автопост новостей: guild=${guildId}`);
    await autoPost(client, channelId);
  });

  jobs.set(guildId, task);

  console.log(`✅ Задача создана: ${guildId} -> ${hour}:${minute}`);
}

/* -------- отключение -------- */
export function disableGuild(guildId) {
  if (jobs.has(guildId)) {
    jobs.get(guildId).stop();
    jobs.delete(guildId);
    console.log(`🛑 Задача удалена: ${guildId}`);
  }
}