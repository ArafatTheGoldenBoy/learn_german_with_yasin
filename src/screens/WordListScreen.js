// src/screens/WordListScreen.js

import React, { useContext, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function WordListScreen({ route, navigation }) {
  const { categoryIndex } = route.params;
  const {
    categories,
    deleteWord,
    setSelectedCategoryIndex, // so the context’s selectedCategoryIndex stays in sync
  } = useContext(AppContext);

  // When this screen mounts, set the context’s selectedCategoryIndex
  useEffect(() => {
    setSelectedCategoryIndex(categoryIndex);
  }, [categoryIndex]);

  // Grab the category object
  const cat = categories[categoryIndex];

  // Update the header title to show “Words: <CategoryName>”
  useEffect(() => {
    navigation.setOptions({
      headerTitle: cat ? `Words: ${cat.name}` : 'Words',
    });
  }, [navigation, cat]);

  // Optionally, re-render whenever categories change
  useFocusEffect(
    React.useCallback(() => {
      // no-op, but this forces a re-render when categories change
    }, [categories])
  );

  const handleDeleteWord = (index) => {
    Alert.alert(
      'Delete Word',
      `Remove "${cat.words[index].original}" from "${cat.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteWord(index),
        },
      ]
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
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.original}>{item.original}</Text>
              <Text style={styles.translations}>
                EN: {item.en || '-'}   BN: {item.bn || '-'}   DE: {item.de || '-'}
              </Text>
              <TouchableOpacity
                style={styles.deleteIcon}
                onPress={() => handleDeleteWord(index)}
              >
                <Ionicons name="trash" size={20} color="red" />
              </TouchableOpacity>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddWord', {
          categoryIndex: categoryIndex,  // or selectedCategoryIndex, whichever you’re using
        })}
      >
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  row: {
    flexDirection: 'column',
    padding: 16,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  original: { fontSize: 18, fontWeight: '500' },
  translations: { fontSize: 14, color: '#555', marginTop: 4 },
  deleteIcon: { position: 'absolute', right: 16, top: 16 },
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
});
