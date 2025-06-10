import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const ENDPOINT = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL    = 'gpt-3.5-turbo';
const KEY      = process.env.EXPO_PUBLIC_OPENROUTER_API_KEY;
const PREFIX   = '@synant:';          // each word gets its own entry

// ---------------- core helper ----------------
export async function getSynAnt(word) {
  const w = word.trim().toLowerCase();
  if (!w) return { synonyms: ['–'], antonyms: ['–'] };

  // 1️⃣ try local cache
  const cached = await AsyncStorage.getItem(PREFIX + w);
  if (cached)      return JSON.parse(cached);   // ← instant return

  // 2️⃣ if offline or key missing, skip API
  if (!KEY)        return { synonyms: ['–'], antonyms: ['–'] };

  // 3️⃣ call OpenRouter one time
  const prompt =
    'Reply ONLY as strict JSON: {"synonyms":[...], "antonyms":[...]} ' +
    `Give up to 5 English synonyms and 5 English antonyms for "${w}".`;

  try {
    const res = await axios.post(
      ENDPOINT,
      { model: MODEL, messages: [{ role: 'user', content: prompt }], temperature: 0.3 },
      { headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' }, timeout: 15000 }
    );

    const parsed = JSON.parse(res.data.choices[0].message.content.trim());
    const value  = {
      synonyms: Array.isArray(parsed.synonyms)  && parsed.synonyms.length
                  ? parsed.synonyms.slice(0, 3) : ['–'],
      antonyms: Array.isArray(parsed.antonyms)  && parsed.antonyms.length
                  ? parsed.antonyms.slice(0, 3) : ['–'],
    };

    // 4️⃣ store under its own key so future calls are free
    await AsyncStorage.setItem(PREFIX + w, JSON.stringify(value));
    return value;
  } catch (e) {
    console.warn('OpenRouter/Async error:', e.message || e);
    return { synonyms: ['–'], antonyms: ['–'] };
  }
}
