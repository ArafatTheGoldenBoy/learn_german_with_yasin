// src/screens/CategoryScreen.js

import React, { useContext, useLayoutEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';
import { Swipeable } from 'react-native-gesture-handler';
import * as Progress from 'react-native-progress';

export default function CategoryScreen({ navigation }) {
  const {
    categories,
    selectedCategoryIndex,
    setSelectedCategoryIndex,
    deleteCategory,
    quizAnswered,
  } = useContext(AppContext);

  // Show “Add Category” in the header (optional)
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: 'Categories',
    });
  }, [navigation]);

  // Navigate into a category’s word list
  const handleSelect = (index) => {
    setSelectedCategoryIndex(index);
    navigation.navigate('WordList', {
      categoryIndex: index,
      categoryName: categories[index].name,
    });
  };

  // Delete confirmation
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

  // Render swipe‐left actions (Edit & Delete)
  const renderRightActions = (index) => (
    <View style={styles.rightActionsContainer}>
      <TouchableOpacity
        style={[styles.actionButton, styles.editButton]}
        onPress={() => {
          /* Navigate to edit name screen or inline prompt */
        }}
      >
        <Ionicons name="create-outline" size={24} color="white" />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.actionButton, styles.deleteButton]}
        onPress={() => handleDeleteCategory(index)}
      >
        <Ionicons name="trash" size={24} color="white" />
      </TouchableOpacity>
    </View>
  );

  // Render each category row
  const renderItem = ({ item, index }) => {
    const totalWords = item.words.length;
    const answeredSet = quizAnswered[index] || new Set();
    const answeredCount = answeredSet.size;
    const progress = totalWords > 0 ? answeredCount / totalWords : 0;

    return (
      <Swipeable
        renderRightActions={() => renderRightActions(index)}
        overshootRight={false}
      >
        <TouchableOpacity
          style={[
            styles.row,
            index === selectedCategoryIndex && styles.selectedRow,
          ]}
          onPress={() => handleSelect(index)}
        >
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.count}>{totalWords} words</Text>
          </View>

          {totalWords > 0 ? (
            <Progress.Circle
              size={32}
              progress={progress}
              showsText={true}
              formatText={() => `${answeredCount}/${totalWords}`}
              thickness={4}
              color="#007AFF"
              unfilledColor="#eee"
              borderWidth={0}
            />
          ) : (
            <View style={{ width: 32, height: 32 }} />
          )}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {categories.length === 0 ? (
          <Text style={styles.emptyText}>
            No categories yet. Tap + to add one.
          </Text>
        ) : (
          <FlatList
            data={categories}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderItem}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        )}

        {/* Floating “+” button to add a new category */}
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => navigation.navigate('AddCategory')}
        >
          <View style={styles.floatingButtonCircle}>
            <Ionicons name="add" size={28} color="white" />
          </View>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const ACTION_BUTTON_WIDTH = 60;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  row: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  selectedRow: {
    backgroundColor: '#e6f7ff',
  },
  name: {
    flex: 1,
    fontSize: 18,
  },
  count: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
    marginLeft: 16,
  },
  emptyText: {
    marginTop: 32,
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
  },
  floatingButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
  },
  floatingButtonCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'blue',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  rightActionsContainer: {
    flexDirection: 'row',
    width: ACTION_BUTTON_WIDTH * 2,
  },
  actionButton: {
    width: ACTION_BUTTON_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#007bff',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
  },
});
