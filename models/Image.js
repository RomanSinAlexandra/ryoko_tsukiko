import mongoose from 'mongoose';

const ImageSchema = new mongoose.Schema({
  url: { type: String, required: true },
  category: { type: String, required: true, index: true },
  nsfw: { type: Boolean, default: false }
}, { timestamps: true });

export const Image = mongoose.model('Image', ImageSchema);