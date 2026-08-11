import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import NetInfo from '@react-native-community/netinfo';

import { callFreeLLM } from './openrouterService';   // helper lives in that file

/* ────── constants ─────────────────────────────────────────── */
const WORD_KEY  = '@flashcard:';       // per-word cache
const RETRY_KEY = '@flashcard_retry';  // queue words on failure/offline
const MEDIA_DIR = FileSystem.documentDirectory + 'flash/';

/* ────── safe downloader (returns local URI or null) ───────── */
const download = async (url) => {
  try {
    if (typeof url !== 'string' || !url.startsWith('http')) return null;
    const name = url.slice(url.lastIndexOf('/') + 1);
    const dest = MEDIA_DIR + name;

    const info = await FileSystem.getInfoAsync(dest);
    if (info.exists) return dest;

    await FileSystem.makeDirectoryAsync(MEDIA_DIR, { intermediates: true });
    await FileSystem.downloadAsync(url, dest);
    return dest;
  } catch {
    return null;
  }
};

/* ────── queue word when not fetched ───────────────────────── */
const queueWord = async (w) => {
  const list = JSON.parse((await AsyncStorage.getItem(RETRY_KEY)) || '[]');
  if (!list.includes(w)) {
    list.push(w);
    await AsyncStorage.setItem(RETRY_KEY, JSON.stringify(list));
  }
};

/* ────── main export ───────────────────────────────────────── */
export async function getCard(rawWord) {
  const word = rawWord.trim().toLowerCase();
  const cacheKey = WORD_KEY + word;

  /* 1 ─ cache hit */
  const hit = await AsyncStorage.getItem(cacheKey);
  if (hit) return JSON.parse(hit);

  /* 2 ─ connectivity */
  const net = await NetInfo.fetch();
  if (!net.isConnected) {
    await queueWord(word);
    return null;
  }

  /* 3 ─ prompt & LLM call */
  const prompt =
    'Return ONLY JSON exactly like:\n' +
    '{ "preposition":"", "example":"", "en":"", "bn":"",\n' +
    '  "conjug3":"",         /* 3rd-person Präsens */\n' +
    '  "perfekt":"",         /* 3rd-person Perfekt */\n' +
    '  "frequency": 0,       /* integer rank */\n' +
    '  "synonyms":[{"en":"","de":"","bn":""}],\n' +
    '  "antonyms":[{"en":"","de":"","bn":""}],\n' +
    '  "mnemonic":"",\n' +
    '  "icon_url":"https://...png",\n' +
    '  "doodle_url":"https://...png" }\n\n' +
    `Use the German infinitive "${word}".  Images must be royalty-free.`;

  try {
    const raw   = await callFreeLLM(prompt);                // rotates free pools
    const match = raw && raw.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('no JSON block');

    const json = JSON.parse(match[0]);

    /* normalise arrays & new fields */
    json.synonyms  = Array.isArray(json.synonyms) ? json.synonyms : [];
    json.antonyms  = Array.isArray(json.antonyms) ? json.antonyms : [];
    json.conjug3   = json.conjug3  || '–';
    json.perfekt   = json.perfekt  || '–';
    json.frequency = Number.isFinite(json.frequency) ? json.frequency : null;

    /* download media */
    json.icon   = await download(json.icon_url);
    json.doodle = await download(json.doodle_url);

    /* cache & return */
    await AsyncStorage.setItem(cacheKey, JSON.stringify(json));
    return json;
  } catch (err) {
    console.warn('flashcard LLM', err.message);
    await queueWord(word);
    return null;
  }
}

/* ────── retry queued words on reconnect ───────────────────── */
NetInfo.addEventListener(async (state) => {
  if (!state.isConnected) return;
  const list = JSON.parse((await AsyncStorage.getItem(RETRY_KEY)) || '[]');
  if (!list.length) return;

  await AsyncStorage.removeItem(RETRY_KEY);
  for (const w of list) await getCard(w);   // will cache if now successful
});
