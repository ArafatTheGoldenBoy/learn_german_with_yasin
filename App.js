// App.js
import React from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { AppProvider } from './src/context/AppContext';
import TabNavigator from './src/navigation/TabNavigator';
import AddCategoryScreen from './src/screens/AddCategoryScreen';
import AddWordScreen from './src/screens/AddWordScreen';
import WordListScreen from './src/screens/WordListScreen';
import EditWordScreen from './src/screens/EditWordScreen';
// (If you have other “Edit” screens, import them here as well)

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProvider>
        <NavigationContainer>
          <Stack.Navigator
            initialRouteName="MainTabs"
            screenOptions={{
              headerStyle: { backgroundColor: '#E53935' },
              headerTintColor: '#fff',
              headerTitle: 'Translate Quiz',      // ← app name shown on all screens
              headerTitleAlign: 'center',         // optional: center the title on iOS/Android
            }}
          >
            {/* 1) The two‐tab navigator */}
            <Stack.Screen
              name="MainTabs"
              component={TabNavigator}
              options={{ headerShown: false }}
            />

            {/* 2) Add / Edit flows pop up on top of the tabs */}
            <Stack.Screen
              name="AddCategory"
              component={AddCategoryScreen}
              options={{ title: 'Add Category' }}
            />
            <Stack.Screen
              name="AddWord"
              component={AddWordScreen}
              options={{ title: 'Add Word' }}
            />
            <Stack.Screen
              name="WordList"
              component={WordListScreen}
              options={({ route }) => ({
                title: route.params.categoryName || 'Words',
              })}
            />
            <Stack.Screen
              name="EditWord"
              component={EditWordScreen}
              options={{ title: 'Edit Word' }}
            />
            {/* If you have an EditCategory or EditWord screen, add it here */}
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </GestureHandlerRootView>
  );
}
