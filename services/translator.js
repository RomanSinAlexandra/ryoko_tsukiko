import axios from 'axios';

export async function translate(text, target = 'ru') {
  if (!text || text.length < 3) return text;

  try {
    const url = 'https://translate.googleapis.com/translate_a/single';

    const res = await axios.get(url, {
      params: {
        client: 'gtx',
        sl: 'en',      
        tl: target,     
        dt: 't',
        q: text
      },
      timeout: 20000
    });

    const translated = res.data[0]
      .map(item => item[0])
      .join('');

    return translated || text;

  } catch (err) {
    console.error('TRANSLATE ERROR:', err.message);
    return text;
  }
}