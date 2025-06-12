import React, { useContext, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import { AppContext } from '../context/AppContext';
import { getSynAnt } from '../services/openrouterService';

/* ────────────────────────────────────────────── */
export default function WordListScreen({ route, navigation }) {
  const { categoryIndex } = route.params;
  const { categories, deleteWordFromCategory, setSelectedCategoryIndex } = useContext(AppContext);

  /* mark category */
  useEffect(() => setSelectedCategoryIndex(categoryIndex), [categoryIndex]);
  const cat = categories[categoryIndex] || { words: [] };

  /* header */
  useEffect(() => navigation.setOptions({ headerTitle: `Words: ${cat.name || ''}` }), [navigation, cat]);
  useFocusEffect(React.useCallback(() => {}, [categories]));

  /* online flag */
  const [isConnected, setIsConnected] = useState(null);
  useEffect(() => {
    const unsub = NetInfo.addEventListener(s => setIsConnected(s.isConnected));
    NetInfo.fetch().then(s => setIsConnected(s.isConnected));
    return () => unsub();
  }, []);

  /* result map */
  const [resultsMap, setResultsMap] = useState({});

  /* sequential fetch with 2 s gap */
  useEffect(() => {
    let cancel = false;
    (async () => {
      setResultsMap({});
      for (let i = 0; i < cat.words.length; i++) {
        if (cancel) break;
        const out = await getSynAnt(cat.words[i].original);
        setResultsMap(prev => ({ ...prev, [i]: out }));
        await new Promise(r => setTimeout(r, 2000));
      }
    })();
    return () => (cancel = true);
  }, [cat.words, isConnected]);

  /* swipe actions */
  const del = idx => Alert.alert(
    'Delete Word', `Remove “${cat.words[idx].original}” from “${cat.name}”?`,
    [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive',
        onPress:() => deleteWordFromCategory(categoryIndex, idx) }
    ]
  );
  const edit = idx => navigation.navigate('EditWord', { categoryIndex, wordIndex: idx });

  const Right = idx => (
    <View style={styles.rightWrap}>
      <TouchableOpacity style={[styles.btn, styles.editBtn]} onPress={() => edit(idx)}>
        <Ionicons name="create-outline" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity style={[styles.btn, styles.delBtn]} onPress={() => del(idx)}>
        <Ionicons name="trash" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const List = (arr, style) => arr.slice(0, 3).map((o,i)=>(
    <Text key={style+i} style={style}>• {o.en} → {o.de} / {o.bn}</Text>
  ));

  const RenderItem = ({ item, index }) => {
    const data = resultsMap[index];
    const loading = data === undefined;

    return (
      <Swipeable overshootRight={false} renderRightActions={() => Right(index)}>
        <View style={styles.row}>
          <Text style={styles.original}>{item.original}</Text>
          <Text style={styles.translation}>DE: {item.de || '–'}</Text>

          {loading ? (
            <ActivityIndicator style={{marginTop:6}} size="small" color="#888" />
          ) : (
            <>
              <Text style={styles.example}>{data.example}</Text>
              <Text style={styles.section}>Synonym ⇢</Text>
              {List(data.synonyms, styles.synLine)}
              <Text style={styles.section}>Antonym ⇢</Text>
              {List(data.antonyms, styles.antLine)}
            </>
          )}

          <View style={styles.chevron}>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </View>
      </Swipeable>
    );
  };

  /* main */
  return (
    <View style={styles.container}>
      {cat.words.length === 0 ? (
        <Text style={styles.empty}>No words yet. Tap “＋” to add.</Text>
      ) : (
        <FlatList
          data={cat.words}
          keyExtractor={(_,i)=>i.toString()}
          renderItem={RenderItem}
          ItemSeparatorComponent={() => <View style={styles.sep} />}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={()=>navigation.navigate('AddWord',{categoryIndex})}>
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

/* ────────────────────────────────────────────── */
const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#fff' },

  row:{ padding:16, backgroundColor:'#fff' },
  original:{ fontSize:20, fontWeight:'500' },
  translation:{ fontSize:16, color:'#555', marginTop:4 },

  example:{ fontSize:14, fontStyle:'italic', marginTop:6, color:'#444' },
  section:{ fontWeight:'600', marginTop:6, color:'#007AFF' },
  synLine:{ fontSize:14, marginLeft:4 },
  antLine:{ fontSize:14, marginLeft:4, color:'#d00' },

  chevron:{ position:'absolute', right:16, top:18 },

  empty:{ marginTop:32, textAlign:'center', color:'#999', fontSize:16 },
  sep:{ height:1, backgroundColor:'#eee' },

  fab:{ position:'absolute', bottom:24, right:24, backgroundColor:'#007AFF',
        width:56, height:56, borderRadius:28, justifyContent:'center',
        alignItems:'center', elevation:4 },

  rightWrap:{ flexDirection:'row', width:120 },
  btn:{ flex:1, justifyContent:'center', alignItems:'center' },
  editBtn:{ backgroundColor:'#007bff' },
  delBtn:{ backgroundColor:'#dc3545' },
});
