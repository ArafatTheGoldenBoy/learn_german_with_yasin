// src/screens/AddCategoryScreen.js

import React, { useState, useContext } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';
import { AppContext } from '../context/AppContext';

export default function AddCategoryScreen({ navigation }) {
  const [name, setName] = useState('');
  const { addCategory } = useContext(AppContext);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      Alert.alert('Validation', 'Please enter a category name.');
      return;
    }
    try {
      await addCategory(trimmed);  // <— calls the function we defined in context
      navigation.goBack();
    } catch (error) {
      console.warn('Error creating category:', error.message);
      Alert.alert('Error', 'Could not create category. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category Name:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Verbs, Foods"
        value={name}
        onChangeText={setName}
      />
      <Button title="Create Category" onPress={handleSave} />
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
