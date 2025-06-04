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
import axios from 'axios';

/* ──────────────────────────────────────────────────────────────
   Helper: Fetch up to 3 English antonyms from DictionaryAPI.dev,
   checking both meaning.antonyms and definition.antonyms.
   ──────────────────────────────────────────────────────────────
*/
async function fetchEnglishAntonyms(englishWord) {
  if (!englishWord || typeof englishWord !== 'string') {
    return [];
  }

  try {
    const response = await axios.get(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(
        englishWord
      )}`
    );
    const data = response.data;
    if (!Array.isArray(data) || data.length === 0) {
      return [];
    }

    const antonymsSet = new Set();

    // 1) Loop through each entry in the array (sometimes multiple entries)
    for (const entry of data) {
      if (!Array.isArray(entry.meanings)) continue;

      // 2) Loop through each meaning (noun, verb, etc.)
      for (const meaning of entry.meanings) {
        // 2a) First, collect any antonyms at the meaning level
        if (
          Array.isArray(meaning.antonyms) &&
          meaning.antonyms.length > 0
        ) {
          for (const ant of meaning.antonyms) {
            if (typeof ant === 'string' && ant.trim() !== '') {
              antonymsSet.add(ant.trim());
              if (antonymsSet.size >= 3) break;
            }
          }
        }
        if (antonymsSet.size >= 3) break;

        // 2b) Next, loop through each definition in that meaning
        if (!Array.isArray(meaning.definitions)) continue;
        for (const defObj of meaning.definitions) {
          if (
            Array.isArray(defObj.antonyms) &&
            defObj.antonyms.length > 0
          ) {
            for (const ant of defObj.antonyms) {
              if (typeof ant === 'string' && ant.trim() !== '') {
                antonymsSet.add(ant.trim());
                if (antonymsSet.size >= 3) break;
              }
            }
          }
          if (antonymsSet.size >= 3) break;
        }
        if (antonymsSet.size >= 3) break;
      }
      if (antonymsSet.size >= 3) break;
    }

    return Array.from(antonymsSet).slice(0, 3);
  } catch (error) {
    console.warn(
      'DictionaryAPI.dev error for',
      englishWord,
      error.message || error
    );
    return [];
  }
}

/* ──────────────────────────────────────────────────────────────
   WordListScreen Component
   ──────────────────────────────────────────────────────────────
   For each word:
     • Show English original (item.original)
     • Show “DE: {item.de}” (user’s manually entered German)
     • Fetch up to 3 English antonyms (meaning.antonyms + definition.antonyms)
     • Show spinner while loading; “Antonym: –” if none found or offline
     • Swipe to Edit (✏️) and Delete (🗑️) remains
   ──────────────────────────────────────────────────────────────
*/
export default function WordListScreen({ route, navigation }) {
  const { categoryIndex } = route.params;
  const {
    categories,
    deleteWordFromCategory,
    setSelectedCategoryIndex,
  } = useContext(AppContext);

  // 1️⃣ Mark this category as selected
  useEffect(() => {
    setSelectedCategoryIndex(categoryIndex);
  }, [categoryIndex]);

  // 2️⃣ Grab the category object (or default to an empty one)
  const cat = categories[categoryIndex] || { words: [] };

  // 3️⃣ Update header title: “Words: {CategoryName}”
  useEffect(() => {
    navigation.setOptions({
      headerTitle: cat ? `Words: ${cat.name}` : 'Words',
    });
  }, [navigation, cat]);

  // 4️⃣ Force a re-render if categories array changes
  useFocusEffect(
    React.useCallback(() => {}, [categories])
  );

  // 5️⃣ Track network connectivity
  const [isConnected, setIsConnected] = useState(null);
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected);
    });
    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // 6️⃣ Map: index → array of fetched antonyms (or ['–'])
  //    While loading, resultsMap[index] is undefined
  const [resultsMap, setResultsMap] = useState({});

  /**
   * 7️⃣ Fetch antonyms for a single English word at index idx:
   *    A) If offline or empty, store ['–']
   *    B) Else call fetchEnglishAntonyms() → if returned array nonempty, store that; else store ['–']
   */
  const fetchAntForWord = useCallback(
    async (englishWord, idx) => {
      const trimmed = englishWord.trim();
      if (!trimmed || !isConnected) {
        // Offline or no input → placeholder
        setResultsMap((prev) => ({
          ...prev,
          [idx]: ['–'],
        }));
        return;
      }
      const antonyms = await fetchEnglishAntonyms(trimmed);
      if (Array.isArray(antonyms) && antonyms.length > 0) {
        setResultsMap((prev) => ({
          ...prev,
          [idx]: antonyms,
        }));
      } else {
        setResultsMap((prev) => ({
          ...prev,
          [idx]: ['–'],
        }));
      }
    },
    [isConnected]
  );

  /**
   * 8️⃣ Whenever cat.words or isConnected changes:
   *    • Clear resultsMap (so spinners appear again)
   *    • For each index in cat.words, call fetchAntForWord(word, index)
   *    • If no words, fill placeholders (although FlatList is empty in that case)
   */
  useEffect(() => {
    setResultsMap({});

    if (cat.words.length > 0) {
      cat.words.forEach((w, idx) => {
        fetchAntForWord(w.original, idx);
      });
    } else {
      cat.words.forEach((_, idx) => {
        setResultsMap((prev) => ({
          ...prev,
          [idx]: ['–'],
        }));
      });
    }
  }, [cat.words, isConnected, fetchAntForWord]);

  // 9️⃣ Confirm & delete a word
  const handleDeleteWord = (idx) => {
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
  };

  // 🔟 Edit action (navigate to EditWord screen if it exists)
  const handleEditWord = (idx) => {
    navigation.navigate('EditWord', {
      categoryIndex,
      wordIndex: idx,
    });
  };

  // 1️⃣1️⃣ Render swipe actions (Edit + Delete)
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

  // 1️⃣2️⃣ Render each row:
  //    • English original (item.original)
  //    • German translation from item.de
  //    • Spinner while antonyms are fetching
  //    • “Antonym: a, b, c” or “Antonym: –”
  const renderItem = ({ item, index }) => {
    const eng = item.original || '–';
    const german = item.de || '–'; // user‐entered German
    const antonyms = resultsMap[index]; // undefined while loading
    const isLoading = isConnected && antonyms === undefined;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(index)}
        overshootRight={false}
      >
        <View style={styles.row}>
          {/* English original */}
          <Text style={styles.original}>{eng}</Text>

          {/* German translation */}
          <Text style={styles.translations}>DE: {german}</Text>

          {/* Show spinner or the “Antonym:” line */}
          {isLoading ? (
            <ActivityIndicator style={{ marginTop: 6 }} size="small" color="#888" />
          ) : (
            <Text style={styles.antText}>
              Antonym: {Array.isArray(antonyms) ? antonyms.join(', ') : '–'}
            </Text>
          )}

          <View style={styles.iconContainer}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>
      </Swipeable>
    );
  };

  return (
    <View style={styles.container}>
      {!cat || cat.words.length === 0 ? (
        <Text style={styles.emptyText}>
          No words yet. Tap the “+” button to add.
        </Text>
      ) : (
        <FlatList
          data={cat.words}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={renderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() =>
          navigation.navigate('AddWord', {
            categoryIndex,
          })
        }
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

/* ──────────────────────────────────────────────────────────────
   Styles
   ──────────────────────────────────────────────────────────────
*/
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

  row: {
    flexDirection: 'column',
    padding: 16,
    backgroundColor: '#fff',
  },
  original: { fontSize: 20, fontWeight: '500' },
  translations: { fontSize: 16, color: '#555', marginTop: 4 },
  antText: { fontSize: 16, color: '#d00', marginTop: 6 },

  iconContainer: {
    position: 'absolute',
    right: 16,
    top: 18,
  },

  emptyText: {
    marginTop: 32,
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
  },
  sep: { height: 1, backgroundColor: '#eee' },
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

  rightActionsContainer: {
    flexDirection: 'row',
    width: 120,
  },
  actionButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: { backgroundColor: '#007bff' },
  deleteButton: { backgroundColor: '#dc3545' },
});
