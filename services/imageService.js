import { Image } from '../models/Image.js';

export async function getImagesByCategory(category, nsfw = false) {
  return Image.find({
    category: category.toLowerCase(),
    nsfw
  }).limit(50);
}