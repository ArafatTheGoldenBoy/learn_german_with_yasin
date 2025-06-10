// src/screens/WordListScreen.js
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
} from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { AppContext } from '../context/AppContext';
import { getSynAnt } from '../services/openrouterService';   // cached helper

// ───────────────────────────────────────────────
// WordListScreen
// ───────────────────────────────────────────────
export default function WordListScreen({ route, navigation }) {
  const { categoryIndex } = route.params;
  const {
    categories,
    deleteWordFromCategory,
    setSelectedCategoryIndex,
  } = useContext(AppContext);

  /* 1️⃣ mark selected category */
  useEffect(() => {
    setSelectedCategoryIndex(categoryIndex);
  }, [categoryIndex]);

  /* 2️⃣ category */
  const cat = categories[categoryIndex] || { words: [] };

  /* 3️⃣ header */
  useEffect(() => {
    navigation.setOptions({ headerTitle: `Words: ${cat.name || ''}` });
  }, [navigation, cat]);

  useFocusEffect(React.useCallback(() => {}, [categories]));

  /* 4️⃣ online / offline */
  const [isConnected, setIsConnected] = useState(null);
  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) =>
      setIsConnected(s.isConnected)
    );
    NetInfo.fetch().then((s) => setIsConnected(s.isConnected));
    return () => unsub();
  }, []);

  /* 5️⃣ results cache: index → { synonyms, antonyms } */
  const [resultsMap, setResultsMap] = useState({});

  /* 6️⃣ fetch (or cached) */
  const fetchForWord = useCallback(async (word, idx) => {
    const w = word.trim();
    if (!w) {
      setResultsMap((p) => ({
        ...p,
        [idx]: { synonyms: [], antonyms: [] },
      }));
      return;
    }
    try {
      const out = await getSynAnt(w); // cached helper
      setResultsMap((p) => ({ ...p, [idx]: out }));
    } catch {
      setResultsMap((p) => ({
        ...p,
        [idx]: { synonyms: [], antonyms: [] },
      }));
    }
  }, []);

  /* 7️⃣ refetch on list change */
  useEffect(() => {
    setResultsMap({});
    cat.words.forEach((w, idx) => fetchForWord(w.original, idx));
  }, [cat.words, isConnected, fetchForWord]);

  // ── actions ───────────────────────────────────
  const del = (idx) =>
    Alert.alert(
      'Delete Word',
      `Remove “${cat.words[idx].original}” from “${cat.name}”?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWordFromCategory(categoryIndex, idx),
        },
      ]
    );
  const edit = (idx) =>
    navigation.navigate('EditWord', { categoryIndex, wordIndex: idx });

  const rightActions = (idx) => (
    <View style={styles.rightWrap}>
      <TouchableOpacity
        style={[styles.actionBtn, styles.editBtn]}
        onPress={() => edit(idx)}
      >
        <Ionicons name="create-outline" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionBtn, styles.delBtn]}
        onPress={() => del(idx)}
      >
        <Ionicons name="trash" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  // ── row renderer ──────────────────────────────
  const renderItem = ({ item, index }) => {
    const eng = item.original || '–';
    const de  = item.de || '–';

    const data = resultsMap[index];          // might be undefined
    const loading = data === undefined;      // show spinner until filled

    /* helpers */
    const renderList = (arr, style) =>
      (arr || []).slice(0, 3).map((o, i) => (
        <Text key={style + i} style={style}>
          • {o.en} → {o.de} / {o.bn} {'\n'}  ex: {o.ex}
        </Text>
      ));

    return (
      <Swipeable overshootRight={false}
                 renderRightActions={() => rightActions(index)}>
        <View style={styles.row}>
          <Text style={styles.original}>{eng}</Text>
          <Text style={styles.translation}>DE: {de}</Text>

          {loading ? (
            <ActivityIndicator
              style={{ marginTop: 6 }}
              size="small"
              color="#888"
            />
          ) : (
            <>
              <Text style={styles.section}>Synonym ⇢</Text>
              {renderList(data.synonyms, styles.synLine)}
              <Text style={styles.section}>Antonym ⇢</Text>
              {renderList(data.antonyms, styles.antLine)}
            </>
          )}

          <View style={styles.chevron}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>
      </Swipeable>
    );
  };

  // ── main render ───────────────────────────────
  return (
    <View style={styles.container}>
      {cat.words.length === 0 ? (
        <Text style={styles.empty}>No words yet. Tap “＋” to add.</Text>
      ) : (
        <FlatList
          data={cat.words}
          keyExtractor={(_, i) => i.toString()}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddWord', { categoryIndex })}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

// ───────────────────────────────────────────────
// styles
// ───────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  row:         { padding: 16, backgroundColor: '#fff' },
  original:    { fontSize: 20, fontWeight: '500' },
  translation: { fontSize: 16, color: '#555', marginTop: 4 },

  section:  { fontWeight: '600', marginTop: 6, color: '#007AFF' },
  synLine:  { fontSize: 14, marginLeft: 4 },
  antLine:  { fontSize: 14, marginLeft: 4, color: '#d00' },

  chevron: { position: 'absolute', right: 16, top: 18 },

  empty: { marginTop: 32, textAlign: 'center', color: '#999', fontSize: 16 },
  sep:   { height: 1, backgroundColor: '#eee' },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#007AFF',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },

  rightWrap:  { flexDirection: 'row', width: 120 },
  actionBtn:  { flex: 1, justifyContent: 'center', alignItems: 'center' },
  editBtn:    { backgroundColor: '#007bff' },
  delBtn:     { backgroundColor: '#dc3545' },
});
