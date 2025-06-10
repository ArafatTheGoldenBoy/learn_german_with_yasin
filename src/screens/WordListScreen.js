// src/screens/WordListScreen.js
import React, { useContext, useEffect, useState, useCallback } from 'react';
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
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import NetInfo from '@react-native-community/netinfo';

import { getSynAnt } from '../services/openrouterService';      // <── new cached helper

// ──────────────────────────────────────────────────────────────
// WordListScreen
// ──────────────────────────────────────────────────────────────
export default function WordListScreen({ route, navigation }) {
  const { categoryIndex } = route.params;
  const {
    categories,
    deleteWordFromCategory,
    setSelectedCategoryIndex,
  } = useContext(AppContext);

  /** 1️⃣ mark selected category for global context */
  useEffect(() => {
    setSelectedCategoryIndex(categoryIndex);
  }, [categoryIndex]);

  /** 2️⃣ category object (fallback empty) */
  const cat = categories[categoryIndex] || { words: [] };

  /** 3️⃣ header title */
  useEffect(() => {
    navigation.setOptions({ headerTitle: `Words: ${cat.name || ''}` });
  }, [navigation, cat]);

  /** 4️⃣ re-render when categories array mutates */
  useFocusEffect(React.useCallback(() => {}, [categories]));

  /** 5️⃣ online / offline flag */
  const [isConnected, setIsConnected] = useState(null);
  useEffect(() => {
    const unsub = NetInfo.addEventListener((s) => setIsConnected(s.isConnected));
    NetInfo.fetch().then((s) => setIsConnected(s.isConnected));
    return () => unsub();
  }, []);

  /** 6️⃣ map: index → { synonyms, antonyms }  (undefined while loading) */
  const [resultsMap, setResultsMap] = useState({});

  /** 7️⃣ helper: fetch (or cache-hit) then store */
  const fetchSynAntForWord = useCallback(
    async (word, idx) => {
      const w = word.trim();
      if (!w) {
        setResultsMap((p) => ({ ...p, [idx]: { synonyms: ['–'], antonyms: ['–'] } }));
        return;
      }
      try {
        const out = await getSynAnt(w);       // handles cache + API
        const res = (out.synonyms.length || out.antonyms.length)
          ? out
          : { synonyms: ['–'], antonyms: ['–'] };
        setResultsMap((p) => ({ ...p, [idx]: res }));
      } catch {
        setResultsMap((p) => ({ ...p, [idx]: { synonyms: ['–'], antonyms: ['–'] } }));
      }
    },
    [],
  );

  /** 8️⃣ trigger fetch on list / connectivity change */
  useEffect(() => {
    setResultsMap({});
    cat.words.forEach((w, idx) => fetchSynAntForWord(w.original, idx));
  }, [cat.words, isConnected, fetchSynAntForWord]);

  // ── action handlers ─────────────────────────────────────────
  const handleDeleteWord = (idx) => {
    Alert.alert(
      'Delete Word',
      `Remove “${cat.words[idx].original}” from “${cat.name}”?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive',
          onPress: () => deleteWordFromCategory(categoryIndex, idx) },
      ],
    );
  };

  const handleEditWord = (idx) => {
    navigation.navigate('EditWord', { categoryIndex, wordIndex: idx });
  };

  const renderRightActions = (idx) => (
    <View style={styles.rightActionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, styles.editButton]}
        onPress={() => handleEditWord(idx)}
      >
        <Ionicons name="create-outline" size={24} color="white" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => handleDeleteWord(idx)}
      >
        <Ionicons name="trash" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  // ── list row ────────────────────────────────────────────────
  const renderItem = ({ item, index }) => {
    const eng    = item.original || '–';
    const german = item.de       || '–';

    const data      = resultsMap[index];                // undefined → still loading
    const isLoading = isConnected && data === undefined;

    const syns = data?.synonyms?.join(', ') ?? '–';
    const ants = data?.antonyms?.join(', ') ?? '–';

    return (
      <Swipeable overshootRight={false}
                 renderRightActions={() => renderRightActions(index)}>
        <View style={styles.row}>
          <Text style={styles.original}>{eng}</Text>
          <Text style={styles.translations}>DE: {german}</Text>

          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 6 }} size="small" color="#888" />
          ) : (
            <>
              <Text style={styles.synText}>Synonym: {syns}</Text>
              <Text style={styles.antText}>Antonym: {ants}</Text>
            </>
          )}

          <View style={styles.iconContainer}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>
      </Swipeable>
    );
  };

  // ── main render ─────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {cat.words.length === 0 ? (
        <Text style={styles.emptyText}>No words yet. Tap “＋” to add.</Text>
      ) : (
        <FlatList
          data={cat.words}
          renderItem={renderItem}
          keyExtractor={(_, i) => i.toString()}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddWord', { categoryIndex })}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────
// styles
// ──────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  row:           { flexDirection: 'column', padding: 16, backgroundColor: '#fff' },
  original:      { fontSize: 20, fontWeight: '500' },
  translations:  { fontSize: 16, color: '#555', marginTop: 4 },
  synText:       { fontSize: 15, color: '#007AFF', marginTop: 6 },
  antText:       { fontSize: 15, color: '#d00',     marginTop: 2 },

  iconContainer: { position: 'absolute', right: 16, top: 18 },

  emptyText: { marginTop: 32, textAlign: 'center', color: '#999', fontSize: 16 },
  sep:       { height: 1, backgroundColor: '#eee' },

  fab: {
    position: 'absolute', bottom: 24, right: 24,
    backgroundColor: '#007AFF', width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center', elevation: 4,
  },

  rightActionsContainer: { flexDirection: 'row', width: 120 },
  actionButton: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  editButton:   { backgroundColor: '#007bff' },
  deleteButton: { backgroundColor: '#dc3545' },
});
