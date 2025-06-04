// src/context/AppContext.js

import React, { createContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const STORAGE_KEY = '@my_translate_quiz_app_categories';

  // 1. categories array: each { name, words: [ { original, lang, en, bn, de }, … ] }
  const [categories, setCategories] = useState([]);
  // 2. Which category is currently “active”
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  // 3. quizAnswered: { [categoryIndex: number]: Set<wordIndex:number> }
  //    Tracks which words in each category have been answered correctly this session
  const [quizAnswered, setQuizAnswered] = useState({});

  // On mount, load categories (and leave quizAnswered empty)
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

  // Persist categories whenever they change
  const persistCategories = async (newCats) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newCats));
    } catch (e) {
      console.error('AsyncStorage.setItem failed:', e);
      throw new Error('StorageError');
    }
  };

  // Add a new category
  const addCategory = async (name) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('ValidationError');
    const newCats = [...categories, { name: trimmed, words: [] }];
    await persistCategories(newCats);
    setCategories(newCats);
  };

  // Rename a category
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

  // Delete a category
  const deleteCategory = async (index) => {
    if (index < 0 || index >= categories.length) return;
    const newCats = categories.filter((_, i) => i !== index);
    await persistCategories(newCats);
    setCategories(newCats);

    // Remove its quizAnswered entry
    setQuizAnswered((prev) => {
      const next = { ...prev };
      delete next[index];
      return next;
    });

    // If we deleted the selected category, reset to 0
    if (index === selectedCategoryIndex) {
      setSelectedCategoryIndex(0);
    }
  };

  // Add a word manually (English + German) to a specific category
  const addManualWordToCategory = async (
    english,
    german,
    overrideCategoryIndex = null
  ) => {
    const index =
      overrideCategoryIndex !== null
        ? overrideCategoryIndex
        : selectedCategoryIndex;
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

    // Reset that category’s quiz progress if it exists
    setQuizAnswered((prev) => {
      const next = { ...prev };
      if (next[index]) {
        delete next[index];
      }
      return next;
    });
  };
  // Update one word in a category (by its index)
  const updateWordInCategory = async (
    categoryIdx,
    wordIdx,
    updatedWordObj
  ) => {
    const cat = categories[categoryIdx];
    if (!cat) return;
    const newWords = cat.words.map((w, i) =>
      i === wordIdx ? { ...w, ...updatedWordObj } : w
    );
    const newCats = categories.map((c, i) =>
      i === categoryIdx ? { ...c, words: newWords } : c
    );
    await persistCategories(newCats);
    setCategories(newCats);
  };
  // Delete a word (by its index in the selected category)
  const deleteWordFromCategory = async (categoryIdx, wordIdx) => {
    const cat = categories[categoryIdx];
    if (!cat) return;
    const updatedWords = cat.words.filter((_, i) => i !== wordIdx);
    const newCats = categories.map((c, i) =>
      i === categoryIdx ? { ...c, words: updatedWords } : c
    );
    await persistCategories(newCats);
    setCategories(newCats);

    // If that word was answered, remove it from quizAnswered
    setQuizAnswered((prev) => {
      const next = { ...prev };
      if (next[categoryIdx]) {
        next[categoryIdx].delete(wordIdx);
        // Also shift down any higher indices in that Set by 1
        const updatedSet = new Set(
          Array.from(next[categoryIdx]).map((idx) =>
            idx > wordIdx ? idx - 1 : idx
          )
        );
        next[categoryIdx] = updatedSet;
      }
      return next;
    });
  };

  //
  // QUIZ PROGRESS HELPERS
  //
  // Mark a word (by its index in that category) as answered correctly
  const markWordCorrect = (categoryIdx, wordIdx) => {
    setQuizAnswered((prev) => {
      const next = { ...prev };
      if (!next[categoryIdx]) {
        next[categoryIdx] = new Set();
      }
      next[categoryIdx].add(wordIdx);
      return next;
    });
  };

  // Reset the quiz progress for a category (e.g. when the user restarts or adds a new word)
  const resetQuizProgress = (categoryIdx) => {
    setQuizAnswered((prev) => {
      const next = { ...prev };
      delete next[categoryIdx];
      return next;
    });
  };

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
        deleteWordFromCategory,
        updateWordInCategory,
        // Quiz progress:
        quizAnswered,       // the map { [catIdx]: Set(wordIdx) }
        markWordCorrect,
        resetQuizProgress,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};
