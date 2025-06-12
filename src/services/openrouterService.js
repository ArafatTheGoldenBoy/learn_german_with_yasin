import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Constants from 'expo-constants';

/* ❶ ── API-key from .env or expo.extra -------------------------------- */
const KEY =
  process.env.EXPO_PUBLIC_OPENROUTER_API_KEY ||
  Constants?.expoConfig?.extra?.EXPO_PUBLIC_OPENROUTER_API_KEY;

/* ❷ ── Priority list: paid GPT-3.5 then free pools -------------------- */
const MODELS = [
  'google/gemma-3n-e4b-it:free',
  'deepseek/deepseek-r1-0528-qwen3-8b:free',
  'nousresearch/nous-hermes-2-mixtral-8x7b-sft:free',
  'gryphe/mythomax-l2:free',
];

const ENDPOINT   = 'https://openrouter.ai/api/v1/chat/completions';
const ROSTER_URL = 'https://openrouter.ai/api/v1/models'; // still used for ttl cache if needed
const WORD_PRE   = '@synant-cache:';                    // per-word cache

/* ❸ ── placeholders ---------------------------------------------------- */
const FILL  = { en: '–', de: '–', bn: '–' };
const EMPTY = { example: '–', synonyms: [FILL], antonyms: [FILL] };

const sleep  = (ms) => new Promise(r => setTimeout(r, ms));
const strip  = (t) => (t.match(/\{[\s\S]*\}/) || ['{}'])[0];
const top3   = (arr=[]) => arr.slice(0,3).map(o => ({ ...FILL, ...o }));

/* ──────────────────────────────────────────────────────────────────────
   getSynAnt(word)   → { example, synonyms:[{en,de,bn}], antonyms:[…] }
────────────────────────────────────────────────────────────────────── */
export async function getSynAnt(rawWord) {
  const word = rawWord.trim().toLowerCase();
  if (!word) return EMPTY;

  /* A ─ cache hit */
  const hit = await AsyncStorage.getItem(WORD_PRE + word);
  if (hit) return JSON.parse(hit);

  if (!KEY) {
    console.warn('OpenRouter key missing');
    return EMPTY;
  }

  /* B ─ prompt (single example sentence) */
  const prompt =
    'Return ONLY this JSON schema:\n' +
    '{ "example": "<German sentence using ORIGINAL German word>",\n' +
    '  "synonyms":[{"en":"","de":"","bn":""}],\n' +
    '  "antonyms":[{"en":"","de":"","bn":""}] }\n\n' +
    `Give up to 5 synonyms and 5 antonyms for the English word "${word}".`;

  /* C ─ iterate over model list */
  for (const model of MODELS) {
    try {
      const res = await axios.post(
        ENDPOINT,
        {
          model,
          response_format: { type: 'json_object' },
          messages: [{ role: 'user', content: prompt }],
          temperature: 0.3,
        },
        {
          headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
          timeout: 15000,
        }
      );

      const json = JSON.parse(strip(res.data.choices[0].message.content));

      const value = {
        example : json.example || '–',
        synonyms: top3(json.synonyms),
        antonyms: top3(json.antonyms),
      };

      await AsyncStorage.setItem(WORD_PRE + word, JSON.stringify(value));
      return value;                                    // ✅  success
    } catch (err) {
      const code = err.response?.status;
      const msg  = err.response?.data?.error?.message || err.message;
      console.warn(`${model} → ${code ?? '?'} ${msg}`);

      if (code === 401 || code === 402) continue;              // unauth / no credit
      if (code === 404 || code === 400) continue;              // invalid id
      if (code === 429 && msg?.includes('free-models-per-day')) continue;
      if (code === 429) await sleep(5000);                     // generic 429
      continue;                                                // try next
    }
  }

  console.warn('All pools failed  → placeholder');
  return EMPTY;
}
