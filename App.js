import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

const Stack = createNativeStackNavigator();

// Tela Principal de Projetos
function HomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Painel de Projetos</Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('ProjectDetails')}
      >
        <Text style={styles.buttonText}>Abrir Detalhes</Text>
      </TouchableOpacity>
    </View>
  );
}

// Tela de Detalhes
function ProjectDetailsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Detalhes do Projeto</Text>
      <Text style={styles.subtitle}>Status: Em Desenvolvimento</Text>
    </View>
  );
}

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
            contentStyle: { backgroundColor: '#1e1e1e' },
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#aaa',
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
          
