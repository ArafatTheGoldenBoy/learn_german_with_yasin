// src/screens/RenameCategoryScreen.js

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import { AppContext } from '../context/AppContext';

export default function RenameCategoryScreen({ route, navigation }) {
  const { categoryIndex } = route.params;
  const {
    categories,
    updateCategoryName,
  } = useContext(AppContext);

  // Prepopulate with the existing name
  const existingName =
    categories[categoryIndex] ? categories[categoryIndex].name : '';
  const [name, setName] = useState(existingName);

  useEffect(() => {
    if (existingName === '') {
      // Should never happen, but if index is invalid…
      Alert.alert(
        'Error',
        'This category does not exist any more.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  }, []);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Please enter a category name.');
      return;
    }
    try {
      await updateCategoryName(categoryIndex, trimmed);
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Could not rename category. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>New Category Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Verbs, Foods"
        value={name}
        onChangeText={setName}
      />
      <Button title="Save" onPress={handleSave} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  label: { fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 24,
    borderRadius: 4,
    fontSize: 18,
  },
});
