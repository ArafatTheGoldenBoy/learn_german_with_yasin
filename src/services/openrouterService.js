import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL    = 'gpt-3.5-turbo';
const KEY      = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const PREFIX   = '@synant-v2:';            // new cache namespace

/** strict fallback obj */
const emptyItem = { en:'–', de:'–', bn:'–', ex:'–' };
const emptyOut  = { synonyms:[emptyItem], antonyms:[emptyItem] };

/** helper to hit cache first, then OpenRouter */
export async function getSynAnt(word) {
  const w = word.trim().toLowerCase();
  if (!w) return emptyOut;

  // ① cache
  const cached = await AsyncStorage.getItem(PREFIX + w);
  if (cached) return JSON.parse(cached);

  // ② if key missing / offline
  if (!KEY) return emptyOut;

  // ③ build prompt
  const prompt =
    `Respond ONLY in strict JSON: {"synonyms":[{en,de,bn,ex}], "antonyms":[{en,de,bn,ex}]}.\n` +
    `Give up to 5 English synonyms *and* up to 5 antonyms for "${w}".\n` +
    `For every synonym & antonym provide:\n` +
    `• "de": single-word German translation\n` +
    `• "bn": single-word Bengali translation (Bangla script)\n` +
    `• "ex": one short German example sentence that uses the German word.\n`;

  try {
    const res = await axios.post(
      ENDPOINT,
      { model: MODEL, messages:[{role:'user', content:prompt}], temperature:0.3 },
      { headers:{Authorization:`Bearer ${KEY}`,'Content-Type':'application/json'}, timeout:15000 }
    );

    const parsed = JSON.parse(res.data.choices[0].message.content.trim());

    // sanitise + shrink to 3 each
    const pick = list => (Array.isArray(list) && list.length
      ? list.slice(0,3).map(o=>({...emptyItem, ...o}))
      : [emptyItem]);

    const out = {
      synonyms : pick(parsed.synonyms),
      antonyms : pick(parsed.antonyms),
    };

    await AsyncStorage.setItem(PREFIX + w, JSON.stringify(out));   // save
    return out;
  } catch (e) {
    console.warn('OpenRouter err:', e.message || e);
    return emptyOut;
  }
}
