// src/screens/CategoryScreen.js

import React, { useContext, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function CategoryScreen({ navigation }) {
  const {
    categories,
    selectedCategoryIndex,
    setSelectedCategoryIndex,
    deleteCategory,
  } = useContext(AppContext);

  // 1) Always show the “+” icon in the header to add a new category
  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: 'Categories',
      headerRight: () => (
        <TouchableOpacity
          style={{ marginRight: 16 }}
          onPress={() => navigation.navigate('AddCategory')}
        >
          <Ionicons name="add-circle" size={28} color="blue" />
        </TouchableOpacity>
      ),
    });
  }, [navigation]);

  const handleSelect = (index) => {
    // 2) Update context so QuizScreen always “knows” which category is active
    setSelectedCategoryIndex(index);
    // 3) Navigate into the WordList for that category
    navigation.navigate('WordList', { categoryIndex: index });
  };

  const handleDeleteCategory = (index) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${categories[index].name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteCategory(index),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {categories.length === 0 ? (
        <Text style={styles.emptyText}>No categories yet. Tap + to add one.</Text>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={[
                styles.row,
                index === selectedCategoryIndex && styles.selectedRow,
              ]}
              onPress={() => handleSelect(index)}
            >
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.count}>{item.words.length} words</Text>

              {/* Delete icon */}
              <TouchableOpacity
                style={styles.iconButton}
                onPress={() => handleDeleteCategory(index)}
              >
                <Ionicons name="trash" size={20} color="red" />
              </TouchableOpacity>
            </TouchableOpacity>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  row: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  selectedRow: { backgroundColor: '#f0f8ff' },
  name: { flex: 1, fontSize: 18 },
  count: { fontSize: 14, color: '#666', marginRight: 12 },
  iconButton: { paddingHorizontal: 8 },
  separator: { height: 1, backgroundColor: '#eee' },
  emptyText: {
    marginTop: 32,
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
  },
});
