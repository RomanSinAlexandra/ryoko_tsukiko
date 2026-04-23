import mongoose from 'mongoose';
import { Events } from 'discord.js';


export async function connectDB(client) {
  try {

    await mongoose.connect(process.env.MONGO_URI);
    console.log('🟢 MongoDB connected');

    client.once(Events.ClientReady, async () => {
      if (typeof initAnimeNewsScheduler === 'function') {
        await initAnimeNewsScheduler(client);
      }
    });

    await client.login(process.env.TOKEN);
    
  } catch (e) {
    console.error('🔴 MongoDB connection error:', e);
    process.exit(1); 
  }
}