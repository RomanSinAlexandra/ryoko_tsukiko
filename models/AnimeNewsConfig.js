import mongoose from 'mongoose';

const AnimeNewsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  hour: { type: Number, required: true },
  minute: { type: Number, default: 0 },
  enabled: { type: Boolean, default: true }
}, { timestamps: true });

export const AnimeNewsConfig = mongoose.model('AnimeNewsConfig', AnimeNewsSchema);