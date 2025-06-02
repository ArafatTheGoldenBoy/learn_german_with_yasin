// src/screens/AddWordScreen.js

import React, { useState, useContext, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { AppContext } from '../context/AppContext';

export default function AddWordScreen({ route, navigation }) {
  // 1) Local state for the two input fields
  const [english, setEnglish] = useState('');
  const [german, setGerman] = useState('');
  // 2) Local state for any inline error message
  const [errorMessage, setErrorMessage] = useState('');

  // 3) Grab our context method
  const { addManualWordToCategory } = useContext(AppContext);

  // 4) Grab the categoryIndex from route.params
  const { categoryIndex } = route.params || {};

  // 5) If someone navigates here incorrectly, show an error
  useEffect(() => {
    if (categoryIndex == null || isNaN(categoryIndex)) {
      setErrorMessage('No category selected.');
    }
  }, []);

  // 6) Called when the user taps “Save Word”
  const handleSave = async () => {
    // Clear any previous error
    setErrorMessage('');

    const trimmedEn = english.trim();
    const trimmedDe = german.trim();

    if (!trimmedEn) {
      setErrorMessage('Please enter the English word.');
      return;
    }
    if (!trimmedDe) {
      setErrorMessage('Please enter the equivalent German word.');
      return;
    }

    try {
      // 7) Use our new context function to save manually
      await addManualWordToCategory(
        trimmedEn,
        trimmedDe,
        categoryIndex
      );

      // 8) On success, go back to the Word List
      navigation.goBack();
    } catch (error) {
      console.warn('Error saving manual word:', error.message);
      if (error.message === 'NoCategorySelected') {
        setErrorMessage('That category does not exist.');
      } else if (error.message === 'StorageError') {
        setErrorMessage('Could not save to storage. Please try again.');
      } else {
        setErrorMessage('Could not save the word. Please try again.');
      }
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* English Input */}
      <Text style={styles.label}>English Word:</Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Apple"
        value={english}
        onChangeText={setEnglish}
        autoCapitalize="none"
        autoFocus
      />

      {/* German Input */}
      <Text style={[styles.label, { marginTop: 16 }]}>
        German Equivalent:
      </Text>
      <TextInput
        style={styles.input}
        placeholder="e.g. Apfel"
        value={german}
        onChangeText={setGerman}
        autoCapitalize="none"
      />

      {/* Save Button */}
      <View style={{ marginTop: 24 }}>
        <Button title="Save Word" onPress={handleSave} />
      </View>

      {/* Inline error text */}
      {errorMessage ? (
        <Text style={styles.errorText}>{errorMessage}</Text>
      ) : null}
    </KeyboardAvoidingView>
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
  errorText: {
    marginTop: 12,
    color: 'red',
    fontSize: 14,
    textAlign: 'center',
  },
});
