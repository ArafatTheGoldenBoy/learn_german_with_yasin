// src/screens/EditWordScreen.js

import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Alert,
} from 'react-native';
import { AppContext } from '../context/AppContext';

export default function EditWordScreen({ route, navigation }) {
  const { categoryIndex, wordIndex } = route.params;
  const {
    categories,
    updateWordInCategory, // you must implement this in AppContext
  } = useContext(AppContext);

  const cat = categories[categoryIndex] || { words: [] };
  const word = cat.words[wordIndex] || {};
  const [english, setEnglish] = useState(word.original || '');
  const [german, setGerman] = useState(word.de || '');

  const handleSave = async () => {
    const trimmedEn = english.trim();
    const trimmedDe = german.trim();
    if (!trimmedEn || !trimmedDe) {
      Alert.alert('Validation', 'Both English & German are required.');
      return;
    }
    try {
      await updateWordInCategory(
        categoryIndex,
        wordIndex,
        { original: trimmedEn, en: trimmedEn, de: trimmedDe, bn: word.bn || '' }
      );
      navigation.goBack();
    } catch (err) {
      Alert.alert('Error', 'Could not save. Try again.');
      console.warn(err);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>English Word:</Text>
      <TextInput
        style={styles.input}
        value={english}
        onChangeText={setEnglish}
        autoCapitalize="none"
      />

      <Text style={[styles.label, { marginTop: 16 }]}>
        German Equivalent:
      </Text>
      <TextInput
        style={styles.input}
        value={german}
        onChangeText={setGerman}
        autoCapitalize="none"
      />

      <View style={{ marginTop: 24 }}>
        <Button title="Save Changes" onPress={handleSave} />
      </View>
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
    borderRadius: 4,
    fontSize: 18,
  },
});
