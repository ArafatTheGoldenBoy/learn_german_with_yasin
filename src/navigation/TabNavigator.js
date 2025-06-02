// src/navigation/TabNavigator.js

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

// Import your two remaining screens:
import CategoryScreen from '../screens/CategoryScreen';
import QuizScreen from '../screens/QuizScreen';

const Tab = createBottomTabNavigator();

export default function TabNavigator() {
  return (
    <Tab.Navigator
      initialRouteName="Categories"
      screenOptions={({ route }) => ({
        headerShown: false, // we’ll rely on the Stack header for each screen
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Categories') {
            iconName = focused ? 'list-circle' : 'list-circle-outline';
          } else if (route.name === 'Quiz') {
            iconName = focused ? 'school' : 'school-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#007AFF',
        tabBarInactiveTintColor: 'gray',
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
