import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Modal } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { create } from 'zustand';

// Store Zustand declarada diretamente para evitar erro de importação
const useProjectStore = create((set) => ({
  projects: [
    { id: '1', title: 'App Projetos', description: 'Pipeline CI/CD configurado.', status: 'Concluído' },
    { id: '2', title: 'Novo Projeto', description: 'Estruturação das telas.', status: 'Em Andamento' }
  ],
  addProject: (title, description) =>
    set((state) => ({
      projects: [
        ...state.projects,
        { id: Date.now().toString(), title, description, status: 'Em Andamento' }
      ]
    })),
  removeProject: (id) =>
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id)
    }))
}));

const Stack = createNativeStackNavigator();

function HomeScreen({ navigation }) {
  const { projects, addProject } = useProjectStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (title.trim()) {
      addProject(title, description);
      setTitle('');
      setDescription('');
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProjectDetails', { project: item })}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardStatus}>{item.status}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Projeto</Text>
            <TextInput
              style={styles.input}
              placeholder="Título"
              placeholderTextColor="#888"
              value={title}
              onChangeText={setTitle}
            />
            <TextInput
              style={styles.input}
              placeholder="Descrição"
              placeholderTextColor="#888"
              value={description}
              onChangeText={setDescription}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleCreate}>
                <Text style={styles.btnText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function ProjectDetailsScreen({ route, navigation }) {
  const { project } = route.params;
  const { removeProject } = useProjectStore();

  const handleDelete = () => {
    removeProject(project.id);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{project.title}</Text>
      <Text style={styles.status}>Status: {project.status}</Text>
      <Text style={styles.description}>{project.description || 'Sem descrição.'}</Text>

      <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
        <Text style={styles.btnDeleteText}>Excluir Projeto</Text>
      </TouchableOpacity>
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
            contentStyle: { backgroundColor: '#121212' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Meus Projetos' }} />
          <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} options={{ title: 'Detalhes' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 16 },
  card: { backgroundColor: '#1e1e1e', padding: 16, borderRadius: 8, marginBottom: 12 },
  cardTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  cardStatus: { color: '#007AFF', marginTop: 4 },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#007AFF', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#2a2a2a', padding: 20, borderRadius: 10 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  input: { backgroundColor: '#1e1e1e', color: '#fff', padding: 12, borderRadius: 6, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  btnCancel: { padding: 10 },
  btnSave: { backgroundColor: '#007AFF', padding: 10, borderRadius: 6 },
  btnText: { color: '#fff', fontWeight: 'bold' },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  status: { color: '#007AFF', fontSize: 16, marginBottom: 16 },
  description: { color: '#ccc', fontSize: 16, lineHeight: 22 },
  btnDelete: { marginTop: 40, backgroundColor: '#FF3B30', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnDeleteText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
        
