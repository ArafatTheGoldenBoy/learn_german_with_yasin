// src/navigation/BottomTabs.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CategoryScreen from '../screens/CategoryScreen';
import QuizScreen from '../screens/QuizScreen';
import { Ionicons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator();

export default function BottomTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: true, // ensure the header (and headerRight) appear
        tabBarIcon: ({ color, size }) => {
          let iconName;
          if (route.name === 'Categories') iconName = 'list';
          else if (route.name === 'Quiz') iconName = 'school';
          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Categories"
        component={CategoryScreen}
        options={{ title: 'Categories' }}
      />
      <Tab.Screen
        name="Quiz"
        component={QuizScreen}
        options={{ title: 'Quiz' }}
      />
    </Tab.Navigator>
  );
}
