// src/context/AppContext.js

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const STORAGE_KEY = '@my_translate_quiz_app_categories';

  // 1. categories = [ { name, words: [ { original, lang, en, bn, de }, … ] }, … ]
  const [categories, setCategories] = useState([]);
  // 2. Which category is selected (for WordList/deleteWord/etc.)
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  // Load categories from AsyncStorage on mount
  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json);
          setCategories(
            Array.isArray(parsed) && parsed.length > 0
              ? parsed
              : [{ name: 'Default', words: [] }]
          );
        } else {
          const defaultCat = { name: 'Default', words: [] };
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([defaultCat]));
          setCategories([defaultCat]);
        }
      } catch (e) {
        console.error('Failed to load categories', e);
      }
    })();
  }, []);

  // Helper to persist categories
  const persistCategories = async (newCats) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCats));
    } catch (e) {
      console.error('AsyncStorage.setItem failed:', e);
      throw new Error('StorageError');
    }
  };

  // addCategory(name)
  const addCategory = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('ValidationError');
    const newCats = [...categories, { name: trimmed, words: [] }];
    await persistCategories(newCats);
    setCategories(newCats);
  };

  // updateCategoryName(index, newName)
  const updateCategoryName = async (index, newName) => {
    if (index < 0 || index >= categories.length) throw new Error('InvalidIndex');
    const trimmed = newName.trim();
    if (!trimmed) throw new Error('ValidationError');
    const newCats = categories.map((c, i) =>
      i === index ? { ...c, name: trimmed } : c
    );
    await persistCategories(newCats);
    setCategories(newCats);
  };

  // deleteCategory(index)
  const deleteCategory = async (index) => {
    if (index < 0 || index >= categories.length) return;
    const newCats = categories.filter((_, i) => i !== index);
    await persistCategories(newCats);
    setCategories(newCats);
    if (index === selectedCategoryIndex) {
      setSelectedCategoryIndex(0);
    }
  };

  // addManualWordToCategory(english, german, overrideIndex)
  const addManualWordToCategory = async (
    english,
    german,
    overrideCategoryIndex = null
  ) => {
    const index =
      overrideCategoryIndex !== null ? overrideCategoryIndex : selectedCategoryIndex;
    const cat = categories[index];
    if (!cat) {
      console.warn('addManualWordToCategory: invalid category index', index);
      throw new Error('NoCategorySelected');
    }

    const newWord = {
      original: english.trim(),
      lang: 'en',
      en: english.trim(),
      bn: '',
      de: german.trim(),
    };

    const updatedWords = [...cat.words, newWord];
    const newCats = categories.map((c, i) =>
      i === index ? { ...c, words: updatedWords } : c
    );
    await persistCategories(newCats);
    setCategories(newCats);
  };

  // deleteWord(wordIndex)
  const deleteWord = async (wordIndex) => {
    const cat = categories[selectedCategoryIndex];
    if (!cat) return;
    const updatedWords = cat.words.filter((_, i) => i !== wordIndex);
    const newCats = categories.map((c, i) =>
      i === selectedCategoryIndex ? { ...c, words: updatedWords } : c
    );
    await persistCategories(newCats);
    setCategories(newCats);
  };

  // ==== RE-ADD THESE TWO HELPERS ====

  // getRandomWord() → pick a random word object from the selected category
  const getRandomWord = () => {
    const cat = categories[selectedCategoryIndex];
    if (!cat || !cat.words || cat.words.length === 0) return null;
    const shuffled = [...cat.words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled[0];
  };

  // getQuizOptions(word, optionCount = 4) → return an array of German options for a given word.
  const getQuizOptions = (word, optionCount = 4) => {
    const cat = categories[selectedCategoryIndex];
    if (!cat || !cat.words) return [];
    const correct = word.de || '';
    // Collect other German translations from this category (excluding the correct word)
    const otherGerman = cat.words
      .filter((w) => w !== word && w.de)
      .map((w) => w.de);
    // Shuffle
    for (let i = otherGerman.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [otherGerman[i], otherGerman[j]] = [otherGerman[j], otherGerman[i]];
    }

    const choices = [correct];
    for (let i = 0; i < optionCount - 1 && i < otherGerman.length; i++) {
      choices.push(otherGerman[i]);
    }
    while (choices.length < optionCount) {
      choices.push(correct + ' ’'); // dummy distractor
    }
    // Final shuffle of the assembled array
    for (let i = choices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [choices[i], choices[j]] = [choices[j], choices[i]];
    }
    return choices;
  };

  // =====================================

  return (
    <AppContext.Provider
      value={{
        categories,
        selectedCategoryIndex,
        setSelectedCategoryIndex,
        addCategory,
        updateCategoryName,
        deleteCategory,
        addManualWordToCategory,
        deleteWord,
        // NOW re-expose these again:
        getRandomWord,
        getQuizOptions,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
