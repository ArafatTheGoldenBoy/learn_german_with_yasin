// src/navigation/RootNavigator.js

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BottomTabs from './BottomTabs';
import WordListScreen from '../screens/WordListScreen';
import AddWordScreen from '../screens/AddWordScreen';
import AddCategoryScreen from '../screens/AddCategoryScreen';
import RenameCategoryScreen from '../screens/RenameCategoryScreen';
import QuizScreen from '../screens/QuizScreen';

const Stack = createNativeStackNavigator();

export default function RootNavigator() {
  return (
    <Stack.Navigator initialRouteName="Tabs" screenOptions={{ headerShown: false }}>
      {/* Bottom tabs (Categories & Quiz) */}
      <Stack.Screen name="Tabs" component={BottomTabs} />

      {/* Word List (for a given category) */}
      <Stack.Screen
        name="WordList"
        component={WordListScreen}
        options={{ headerShown: true, title: 'Words' }}
      />

      {/* Add Word (manual entry) */}
      <Stack.Screen
        name="AddWord"
        component={AddWordScreen}
        options={{ headerShown: true, title: 'Add Word' }}
      />

      {/* Add Category */}
      <Stack.Screen
        name="AddCategory"
        component={AddCategoryScreen}
        options={{ headerShown: true, title: 'Add Category' }}
      />

      {/* Rename Category */}
      <Stack.Screen
        name="RenameCategory"
        component={RenameCategoryScreen}
        options={{ headerShown: true, title: 'Rename Category' }}
      />

      {/* Quiz Screen */}
      <Stack.Screen
        name="Quiz"
        component={QuizScreen}
        options={{ headerShown: true, title: 'Quiz' }}
      />
    </Stack.Navigator>
  );
}
