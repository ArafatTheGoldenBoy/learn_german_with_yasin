// src/screens/QuizScreen.js

import React, {
  useContext,
  useState,
  useEffect,
  useCallback
} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AppContext } from '../context/AppContext';

export default function QuizScreen() {
  const { categories } = useContext(AppContext);

  //
  // 1) Flatten all categories’ words into one array of { original, de }:
  //    Only keep entries that have both nonempty English and German.
  //
  const allWords = categories
    .flatMap((cat) =>
      cat.words.map((w) => ({
        original: w.en || w.original,
        de: w.de,
      }))
    )
    .filter((w) => w.original && w.de);

  // For debugging:
  console.log('QuizScreen: allWords.length =', allWords.length);

  //
  // 2) Local state:
  //    - pool: a shuffled array of indices [0 … N-1], where N = allWords.length
  //    - initialized: whether we’ve already built the pool once
  //    - currentIdx: the index into allWords of the question being shown
  //    - options: the 4 German choices for that question
  //    - finished: true only when pool is empty
  //    - hasAlerted: ensures “All Done” shows only once per cycle
  //
  const [pool, setPool] = useState([]);
  const [initialized, setInitialized] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(null);
  const [options, setOptions] = useState([]);
  const [finished, setFinished] = useState(false);
  const [hasAlerted, setHasAlerted] = useState(false);

  //
  // 3) Utility: shuffle an array in place
  //
  const shuffleInPlace = (arr) => {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  };

  //
  // 4) Build the pool once, the moment allWords.length > 0 and not initialized yet.
  //
  useEffect(() => {
    const N = allWords.length;

    console.log(
      'useEffect[allWords.length, initialized]: N =',
      N,
      'initialized =',
      initialized
    );

    if (N > 0 && !initialized) {
      // Create [0, 1, …, N-1] and shuffle it
      const indices = Array.from({ length: N }, (_, i) => i);
      shuffleInPlace(indices);
      console.log('→ Pool initialized to:', indices);
      setPool(indices);
      setFinished(false);
      setCurrentIdx(null);
      setOptions([]);
      setHasAlerted(false);
      setInitialized(true);

      // Immediately pick the first word
      const first = indices[0];
      setCurrentIdx(first);

      // Build options for that first word:
      const correctGerman = allWords[first].de;
      const otherGerman = allWords
        .filter((_, idx) => idx !== first)
        .map((w) => w.de);
      shuffleInPlace(otherGerman);
      const distractors = otherGerman.slice(0, 3);
      const choiceSet = [correctGerman, ...distractors];
      shuffleInPlace(choiceSet);
      setOptions(choiceSet);

      // Remove the first index from pool
      setPool(indices.slice(1));
    }

    if (N === 0) {
      // No words available → clear everything
      console.log('→ No words; pool cleared');
      setPool([]);
      setFinished(true);
      setCurrentIdx(null);
      setOptions([]);
      setHasAlerted(false);
      setInitialized(false);
    }
  }, [allWords.length, initialized]);

  //
  // 5) pickNextWord: called only when user answers correctly
  //
  const pickNextWord = useCallback(() => {
    if (pool.length === 0) {
      console.log('pickNextWord: pool is empty; set finished = true');
      setFinished(true);
      return;
    }

    // Pop the first index
    const [next, ...rest] = pool;
    setPool(rest);
    setCurrentIdx(next);

    // Build options: correctGerman + up to 3 random others
    const correctGerman = allWords[next].de;
    const otherGerman = allWords
      .filter((_, idx) => idx !== next)
      .map((w) => w.de);
    shuffleInPlace(otherGerman);
    const distractors = otherGerman.slice(0, 3);
    const choiceSet = [correctGerman, ...distractors];
    shuffleInPlace(choiceSet);
    setOptions(choiceSet);

    console.log('→ next index =', next);
    console.log('→ correctGerman =', correctGerman);
    console.log('→ options =', choiceSet);
    console.log('→ remaining pool =', rest);
  }, [pool, allWords]);

  //
  // 6) Show “All Done” alert only when this screen is focused and not alerted yet
  //
  useFocusEffect(
    useCallback(() => {
      console.log(
        'useFocusEffect fired; finished =',
        finished,
        'hasAlerted =',
        hasAlerted
      );
      if (finished && !hasAlerted) {
        setHasAlerted(true);
        Alert.alert(
          'All Done',
          'You have gone through every word. Do you want to start again?',
          [
            {
              text: 'Yes',
              onPress: () => {
                // Rebuild the pool from scratch
                const N = allWords.length;
                const fresh = Array.from({ length: N }, (_, i) => i);
                shuffleInPlace(fresh);
                console.log('→ Reinitializing pool to:', fresh);
                setPool(fresh);
                setFinished(false);
                setHasAlerted(false);

                // Immediately pick first of the new pool:
                const first = fresh[0];
                setCurrentIdx(first);

                // Build options for that first word:
                const correctGerman2 = allWords[first].de;
                const otherGerman2 = allWords
                  .filter((_, idx) => idx !== first)
                  .map((w) => w.de);
                shuffleInPlace(otherGerman2);
                const distractors2 = otherGerman2.slice(0, 3);
                const choiceSet2 = [correctGerman2, ...distractors2];
                shuffleInPlace(choiceSet2);
                setOptions(choiceSet2);

                // Remove the first from pool
                setPool(fresh.slice(1));
              },
            },
            { text: 'No', style: 'cancel' },
          ]
        );
      }
    }, [finished, hasAlerted, allWords.length])
  );

  //
  // 7) Handler when the user taps one of the German options
  //
  const handleAnswer = (chosen) => {
    if (currentIdx === null) return;
    const correctGerman = allWords[currentIdx].de;
    if (chosen === correctGerman) {
      Alert.alert(
        'Correct!',
        `"${allWords[currentIdx].original}" → "${correctGerman}"`,
        [{ text: 'Next', onPress: () => pickNextWord() }]
      );
    } else {
      Alert.alert('Try again', `"${chosen}" is not correct.`, [{ text: 'OK' }]);
    }
  };

  //
  // 8) Render logic
  //

  // (a) No words at all
  if (allWords.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noWordText}>
          No words available in any category. Please add some first.
        </Text>
      </View>
    );
  }

  // (b) If finished or we haven’t set currentIdx yet (i.e. waiting for initialization), show “Preparing quiz…”
  if (finished || currentIdx === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.noWordText}>Preparing quiz…</Text>
      </View>
    );
  }

  // (c) Otherwise, show the current question and its four options
  const currentWord = allWords[currentIdx];
  return (
    <View style={styles.container}>
      <Text style={styles.prompt}>Translate the word:</Text>
      <Text style={styles.original}>{currentWord.original}</Text>

      {options.map((opt, idx) => (
        <TouchableOpacity
          key={idx}
          style={styles.button}
          onPress={() => handleAnswer(opt)}
        >
          <Text style={styles.buttonText}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  prompt: {
    fontSize: 18,
    marginBottom: 12,
  },
  original: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
  },
  button: {
    width: '80%',
    padding: 12,
    marginVertical: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
  },
  noWordText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    marginTop: 32,
  },
});
