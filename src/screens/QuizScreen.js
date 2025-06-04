// src/screens/QuizScreen.js

import React, {
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppContext } from '../context/AppContext';
import { Ionicons } from '@expo/vector-icons';

export default function QuizScreen() {
  const {
    categories,
    selectedCategoryIndex,
    quizAnswered,
    markWordCorrect,
    resetQuizProgress,
  } = useContext(AppContext);

  // 1) Grab only the words from the selected category:
  const currentCategory = categories[selectedCategoryIndex] || { words: [] };
  const words = currentCategory.words;

  // 2) Build a filtered array of { original, de }:
  const allWords = words
    .map((w) => ({
      original: w.en || w.original,
      de: w.de,
    }))
    .filter((w) => w.original && w.de);

  // Debug:
  console.log(
    'QuizScreen: category',
    selectedCategoryIndex,
    'total words =',
    allWords.length
  );

  // 3) Local state:
  const [pool, setPool] = useState([]); // shuffled indices
  const [initialized, setInitialized] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(null);
  const [options, setOptions] = useState([]); // 4 German choices
  const [finished, setFinished] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false);
  const [feedback, setFeedback] = useState(''); // "", "Correct!", or "Wrong!"
  const [showAnswer, setShowAnswer] = useState(false); // whether to reveal correct answer

  // 4) Shuffle utility:
  const shuffleInPlace = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  // 5) Initialize the pool once when category or its word list changes:
  useEffect(() => {
    const N = allWords.length;

    // Reset this category’s quiz progress whenever words change
    resetQuizProgress(selectedCategoryIndex);

    if (N > 0) {
      // Build [0..N-1], shuffle
      const indices = Array.from({ length: N }, (_, i) => i);
      shuffleInPlace(indices);
      console.log('→ Initialized pool to:', indices);
      setPool(indices);
      setFinished(false);
      setCurrentIdx(null);
      setOptions([]);
      setHasAlerted(false);
      setInitialized(true);
      setFeedback('');
      setShowAnswer(false);

      // Immediately pick the first word
      const first = indices[0];
      setCurrentIdx(first);

      // Build its options
      const correctGerman = allWords[first].de;
      const otherGerman = allWords
        .filter((_, idx) => idx !== first)
        .map((w) => w.de);
      shuffleInPlace(otherGerman);
      const distractors = otherGerman.slice(0, 3);
      const choiceSet = [correctGerman, ...distractors];
      shuffleInPlace(choiceSet);
      setOptions(choiceSet);

      // Remove that first index
      setPool(indices.slice(1));
    } else {
      // No words in this category
      console.log('→ No words; clearing pool');
      setPool([]);
      setFinished(true);
      setCurrentIdx(null);
      setOptions([]);
      setHasAlerted(false);
      setInitialized(false);
      setFeedback('');
      setShowAnswer(false);
    }
  }, [selectedCategoryIndex, allWords.length]);

  // 6) pickNextWord: called after “Correct!” feedback
  const pickNextWord = useCallback(() => {
    setShowAnswer(false);
    if (pool.length === 0) {
      console.log('pickNextWord: pool empty → finished');
      setFinished(true);
      return;
    }
    const [next, ...rest] = pool;
    setPool(rest);
    setCurrentIdx(next);

    // Build 4 options for the next word
    const correctGerman = allWords[next].de;
    const otherGerman = allWords
      .filter((_, idx) => idx !== next)
      .map((w) => w.de);
    shuffleInPlace(otherGerman);
    const distractors = otherGerman.slice(0, 3);
    const choiceSet = [correctGerman, ...distractors];
    shuffleInPlace(choiceSet);
    setOptions(choiceSet);

    console.log('→ Next index:', next);
    console.log('→ Options:', choiceSet);
    console.log('→ Remaining pool:', rest);
  }, [pool, allWords]);

  // 7) Show “All Done” alert only when this screen is focused and not alerted yet,
  //    and reset progress before prompting.
  useFocusEffect(
    useCallback(() => {
      if (finished && !hasAlerted) {
        // Clear progress for this category so its circle goes back to 0/total
        resetQuizProgress(selectedCategoryIndex);

        setHasAlerted(true);
        // Small timeout so the “Preparing quiz…” text renders before the alert
        setTimeout(() => {
          Alert.alert(
            'All Done',
            'You have gone through every word in this category. Start again?',
            [
              {
                text: 'Yes',
                onPress: () => {
                  // Rebuild pool for a fresh cycle
                  const N = allWords.length;
                  const fresh = Array.from({ length: N }, (_, i) => i);
                  shuffleInPlace(fresh);
                  console.log('→ Reinitializing pool to:', fresh);
                  setPool(fresh);
                  setFinished(false);
                  setHasAlerted(false);
                  setFeedback('');
                  setShowAnswer(false);

                  // Immediately pick first
                  const first = fresh[0];
                  setCurrentIdx(first);
                  const correctGerman2 = allWords[first].de;
                  const otherGerman2 = allWords
                    .filter((_, idx) => idx !== first)
                    .map((w) => w.de);
                  shuffleInPlace(otherGerman2);
                  const distractors2 = otherGerman2.slice(0, 3);
                  const choiceSet2 = [correctGerman2, ...distractors2];
                  shuffleInPlace(choiceSet2);
                  setOptions(choiceSet2);
                  setPool(fresh.slice(1));
                },
              },
              { text: 'No', style: 'cancel' },
            ]
          );
        }, 100);
      }
    }, [finished, hasAlerted, allWords.length])
  );

  // 8) Handle answer taps
  const handleAnswer = (chosen) => {
    if (currentIdx === null) return;

    const correctGerman = allWords[currentIdx].de;

    if (chosen === correctGerman) {
      // Mark correct in context
      markWordCorrect(selectedCategoryIndex, currentIdx);

      // Show “Correct!” in green
      setFeedback('Correct!');
      // After 2 seconds, clear feedback and go to next word
      setTimeout(() => {
        setFeedback('');
        pickNextWord();
      }, 2000);
    } else {
      // Show “Wrong!” in red for 2 seconds, then clear
      setFeedback('Wrong!');
      setTimeout(() => {
        setFeedback('');
      }, 2000);
    }
  };

  // 9) Reveal answer handler
  const revealAnswer = () => {
    setShowAnswer(true);
    // Optionally, hide after 2 seconds:
    setTimeout(() => setShowAnswer(false), 2000);
  };

  // 10) Render logic

  // (a) No words in this category
  if (allWords.length === 0) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.noWordText}>
            No words in this category. Please add some first.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // (b) If finished or waiting for first question
  if (finished || currentIdx === null) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={styles.noWordText}>Preparing quiz…</Text>
        </View>
      </SafeAreaView>
    );
  }
  if (currentIdx < 0 || currentIdx >= allWords.length) {
  // (Optionally you could console.warn here.)
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.noWordText}>Preparing quiz…</Text>
      </View>
    </SafeAreaView>
    );
  }
  // (c) Otherwise show question
  const currentWord = allWords[currentIdx];
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <Text style={styles.prompt}>Translate the word:</Text>
          <TouchableOpacity onPress={revealAnswer} style={styles.eyeButton}>
            <Ionicons name="eye" size={28} color="gray" />
          </TouchableOpacity>
        </View>

        <Text style={styles.original}>{currentWord.original}</Text>

        {/* 11) Inline feedback text */}
        {!!feedback && (
          <Text
            style={[
              styles.feedback,
              feedback === 'Correct!' ? styles.correct : styles.wrong,
            ]}
          >
            {feedback}
          </Text>
        )}

        {/* 12) Show correct answer if requested */}
        {showAnswer && (
          <Text style={styles.revealText}>Answer: {currentWord.de}</Text>
        )}

        {/* 13) Answer options */}
        {options.map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            style={[
              styles.button,
              !!feedback && styles.disabledButton,
            ]}
            onPress={() => handleAnswer(opt)}
            disabled={!!feedback} // disable taps while feedback is showing
          >
            <Text style={styles.buttonText}>{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
  },
  headerRow: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eyeButton: {
    padding: 8,
  },
  prompt: {
    fontSize: 18,
    marginBottom: 8,
  },
  original: {
    fontSize: 32,
    fontWeight: '600',
    marginBottom: 16,
  },
  feedback: {
    fontSize: 28,
    marginBottom: 16,
  },
  correct: {
    color: 'green',
  },
  wrong: {
    color: 'red',
  },
  revealText: {
    fontSize: 28,
    color: '#444',
    marginBottom: 16,
  },
  button: {
    width: '80%',
    padding: 12,
    marginVertical: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 32,
  },
  noWordText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 32,
  },
});
