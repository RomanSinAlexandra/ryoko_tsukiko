import axios from 'axios';

const api = axios.create({
  baseURL: 'https://kitsu.io/api/edge',
  headers: { Accept: 'application/vnd.api+json' }
});

function normalizeAnime(item) {
  const a = item.attributes;

  return {
    id: item.id,
    title:
      a.titles.en ||
      a.titles.en_jp ||
      a.titles.ja_jp ||
      'Без названия',
    synopsis: a.synopsis || 'Описание отсутствует',
    episodes: a.episodeCount ?? '—',
    rating: a.averageRating ?? '—',
    poster: a.posterImage?.medium ?? null,
    year: a.startDate?.slice(0, 4) ?? '—',
    status: a.status
  };
}

export async function searchAnime(query, limit = 10) {
  const { data } = await api.get('/anime', {
    params: {
      'filter[text]': query,
      'page[limit]': limit
    }
  });

  return data.data.map(normalizeAnime);
}

export async function getRandomAnime() {
  const offset = Math.floor(Math.random() * 20000);

  const { data } = await api.get('/anime', {
    params: {
      'page[limit]': 1,
      'page[offset]': offset
    }
  });

  return data.data.length ? normalizeAnime(data.data[0]) : null;
}

export async function getTopAnime(limit = 10) {
  const { data } = await api.get('/anime', {
    params: {
      sort: '-averageRating',
      'page[limit]': limit
    }
  });

  return data.data.map(normalizeAnime);
}

export async function getSeasonHits(limit = 10) {
  const year = new Date().getFullYear();

  const { data } = await api.get('/anime', {
    params: {
      'filter[seasonYear]': year,
      sort: '-averageRating',
      'page[limit]': limit
    }
  });

  return data.data.map(normalizeAnime);
}
