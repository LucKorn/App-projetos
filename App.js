import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import HomeScreen from './src/screens/HomeScreen';
import ProjectDetailsScreen from './src/screens/ProjectDetailsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#121212' },
            headerTintColor: '#fff',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#121212' },
          }}
        >
          <Stack.Screen 
            name="Home" 
            component={HomeScreen} 
            options={{ title: 'Meus Projetos' }} 
          />
          <Stack.Screen 
            name="ProjectDetails" 
            component={ProjectDetailsScreen} 
            options={{ title: 'Detalhes' }} 
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
