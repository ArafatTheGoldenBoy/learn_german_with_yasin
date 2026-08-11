import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';

export default function FlashCardScreen({ route }) {
  const entry = route.params?.entry ?? {};

  const { de, preposition = '', mnemonic = '' }     = entry;
  const { example = '', synonyms = [], antonyms = [] } = entry.api  ?? {};
  const {
    icon = null,
    doodle = null,
    conjug3 = '–',
    perfekt = '–',
    frequency = null,
  } = entry.card ?? {};

  /* safe list helper */
  const list = (arr) =>
    (Array.isArray(arr) ? arr : []).slice(0, 5).map((o, i) => (
      <Text key={i} style={styles.listItem}>
        {o.de}{' '}
        <Text style={styles.muted}>{o.en}</Text>{' '}
        <Text style={styles.bn}>{o.bn}</Text>
      </Text>
    ));

  const line = (label, node) =>
    node ? (
      <View style={{ rowGap: 4, marginTop: 10 }}>
        <Text style={styles.section}>{label}</Text>
        {node}
      </View>
    ) : null;

  return (
    <ScrollView contentContainerStyle={styles.card}>
      {/* header */}
      <View style={styles.rowHeader}>
        {icon && <Image source={{ uri: icon }} style={styles.flag} />}
        <View style={{ flexShrink: 1 }}>
          <Text style={styles.word}>{de}</Text>
          {!!preposition && <Text style={styles.prep}>{preposition}</Text>}
        </View>
      </View>

      <View style={styles.hr} />

      {/* example & translations */}
      {line('Beispiel', <Text style={styles.example}>{example}</Text>)}
      {line('Übersetzung (EN)', <Text style={styles.enBn}>{entry.en}</Text>)}
      {line('Übersetzung (BN)', <Text style={styles.enBn}>{entry.bn}</Text>)}

      {/* conjugations & freq */}
      {line('3. Pers Präsens', <Text style={styles.enBn}>{conjug3}</Text>)}
      {line('Perfekt (3. Pers)', <Text style={styles.enBn}>{perfekt}</Text>)}
      {frequency !== null &&
        line('Häufigkeitsrang', <Text style={styles.enBn}>#{frequency}</Text>)}

      <View style={styles.hr} />

      {/* synonyms / antonyms */}
      <View style={styles.rowSA}>
        <View style={{ flex: 1 }}>
          {line('Synonyme', list(synonyms))}
          {line('Antonyme', list(antonyms))}
        </View>
        {doodle && <Image source={{ uri: doodle }} style={styles.doodle} />}
      </View>

      <View style={styles.hr} />

      {line('Mnemonic', <Text style={styles.mnText}>{mnemonic}</Text>)}
    </ScrollView>
  );
}

/* ───── styles ───── */
const green = '#0f8a82';
const muted = '#777';

const styles = StyleSheet.create({
  card: { padding: 20, backgroundColor: '#fafafa', minHeight: '100%' },

  rowHeader: { flexDirection: 'row', alignItems: 'center', columnGap: 12 },
  flag: { width: 36, height: 36, resizeMode: 'contain' },
  word: { fontSize: 34, fontWeight: '600' },
  prep: { color: muted, fontSize: 20, marginTop: -2 },

  hr: { height: 1, backgroundColor: '#ddd', marginVertical: 16 },

  example: { fontSize: 18, lineHeight: 24 },
  enBn: { fontSize: 18, color: green },

  section: { fontWeight: '600', color: green, fontSize: 18 },
  listItem: { fontSize: 16, lineHeight: 22 },
  muted: { color: muted },
  bn: { fontSize: 16 },

  rowSA: { flexDirection: 'row', columnGap: 12 },
  doodle: { width: 110, height: 110, resizeMode: 'contain' },

  mnText: { fontSize: 16 },
});
