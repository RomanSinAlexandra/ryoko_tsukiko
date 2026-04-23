import cron from 'node-cron';
import AnimeNewsConfig from './models/AnimeNewsConfig.js';
import { autoPost } from './autopost.js';

export async function startSchedulers(client) {
  const configs = await AnimeNewsConfig.find({ enabled: true });

  for (const cfg of configs) {
    const cronTime = `${cfg.minute} ${cfg.hour} * * *`;

    cron.schedule(cronTime, async () => {
      console.log(`📰 AutoNews | ${cfg.guildId} -> ${cfg.channelId}`);
      await autoPost(client, cfg.channelId);
    });

    console.log(`⏱ Scheduler set: ${cfg.guildId} at ${cfg.hour}:${cfg.minute}`);
  }
}
