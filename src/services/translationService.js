// src/services/translationService.js

import axios from 'axios';

/**
 * Translate a single word or short phrase.
 *
 * text: string to translate
 * sourceLang: either "en" or "bn"
 *
 * Returns an object { en, bn, de } (all three in final).
 * If sourceLang is 'en', we request bn+de; if 'bn', we request en+de.
 */
export const translateWord = async (text, sourceLang) => {
  // LibreTranslate API: https://libretranslate.com/docs/
  // Note: public instance has rate limits. For production, self-host or get an API key.
  const endpoint = 'https://libretranslate.de/translate';

  // Decide targets
  const targets = sourceLang === 'en' ? ['bn', 'de'] : sourceLang === 'bn' ? ['en', 'de'] : ['en', 'bn', 'de'];

  const result = { en: '', bn: '', de: '' };

  // Loop through each target
  for (let target of targets) {
    try {
      const res = await axios.post(
        endpoint,
        {
          q: text,
          source: sourceLang,
          target: target,
          format: 'text',
        },
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
      if (res.data && res.data.translatedText) {
        result[target] = res.data.translatedText;
      }
    } catch (error) {
      console.warn(`LibreTranslate error translating to ${target}:`, error);
      // If one fails, leave that field as an empty string
    }
  }

  // Also store the original as en or bn
  if (sourceLang === 'en') result.en = text;
  if (sourceLang === 'bn') result.bn = text;

  return result;
};
