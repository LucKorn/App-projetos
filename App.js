import React, { useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, Modal, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- STORE ZUSTAND COM PERSISTÊNCIA ---
const useProjectStore = create(
  persist(
    (set) => ({
      projects: [
        {
          id: '1',
          title: 'Configurar Pipeline CI/CD',
          description: 'Ajustar GitHub Actions para compilação automática do APK.',
          status: 'Concluído',
          tasks: [
            { id: '101', text: 'Configurar workflow no GitHub', completed: true },
            { id: '102', text: 'Validar build no EAS', completed: true },
          ],
        },
        {
          id: '2',
          title: 'Interface do App de Projetos',
          description: 'Implementar fluxo completo com tarefas e persistência local.',
          status: 'Em Andamento',
          tasks: [
            { id: '201', text: 'Criar store com Zustand e AsyncStorage', completed: true },
            { id: '202', text: 'Adicionar gerenciador de tarefas por projeto', completed: false },
          ],
        },
      ],

      addProject: (title, description) =>
        set((state) => ({
          projects: [
            ...state.projects,
            {
              id: Date.now().toString(),
              title,
              description,
              status: 'Pendente',
              tasks: [],
            },
          ],
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),

      updateProjectStatus: (id, status) =>
        set((state) => ({
          projects: state.projects.map((p) => (p.id === id ? { ...p, status } : p)),
        })),

      addTask: (projectId, taskText) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                tasks: [...p.tasks, { id: Date.now().toString(), text: taskText, completed: false }],
              };
            }
            return p;
          }),
        })),

      toggleTask: (projectId, taskId) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, completed: !t.completed } : t)),
              };
            }
            return p;
          }),
        })),

      removeTask: (projectId, taskId) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                tasks: p.tasks.filter((t) => t.id !== taskId),
              };
            }
            return p;
          }),
        })),
    }),
    {
      name: 'projects-app-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

const Stack = createNativeStackNavigator();

// --- TELA PRINCIPAL (HOME) ---
function HomeScreen({ navigation }) {
  const { projects, addProject } = useProjectStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  const handleCreate = () => {
    if (title.trim()) {
      addProject(title.trim(), description.trim());
      setTitle('');
      setDescription('');
      setModalVisible(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Concluído':
        return '#34C759';
      case 'Em Andamento':
        return '#007AFF';
      default:
        return '#FF9500';
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const completedTasks = item.tasks.filter((t) => t.completed).length;
          const totalTasks = item.tasks.length;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '22' }]}>
                  <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
                </View>
              </View>

              {item.description ? (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.cardTasksText}>
                  {totalTasks > 0 ? `${completedTasks}/${totalTasks} tarefas concluídas` : 'Nenhuma tarefa adicionada'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Projeto</Text>

            <TextInput
              style={styles.input}
              placeholder="Título do Projeto"
              placeholderTextColor="#666"
              value={title}
              onChangeText={setTitle}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Descrição (opcional)"
              placeholderTextColor="#666"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleCreate}>
                <Text style={styles.btnTextSave}>Criar Projeto</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- TELA DE DETALHES DO PROJETO ---
function ProjectDetailsScreen({ route, navigation }) {
  const { projectId } = route.params;
  const project = useProjectStore((state) => state.projects.find((p) => p.id === projectId));
  const { removeProject, updateProjectStatus, addTask, toggleTask, removeTask } = useProjectStore();

  const [taskInput, setTaskInput] = useState('');

  if (!project) return null;

  const handleAddTask = () => {
    if (taskInput.trim()) {
      addTask(project.id, taskInput.trim());
      setTaskInput('');
    }
  };

  const handleDeleteProject = () => {
    removeProject(project.id);
    navigation.goBack();
  };

  const statusOptions = ['Pendente', 'Em Andamento', 'Concluído'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.detailsContent}>
      <Text style={styles.title}>{project.title}</Text>
      {project.description ? <Text style={styles.description}>{project.description}</Text> : null}

      {/* Seleção de Status */}
      <Text style={styles.sectionTitle}>Status do Projeto</Text>
      <View style={styles.statusContainer}>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.statusOption, project.status === status && styles.statusOptionActive]}
            onPress={() => updateProjectStatus(project.id, status)}
          >
            <Text style={[styles.statusOptionText, project.status === status && styles.statusOptionTextActive]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Seção de Tarefas */}
      <Text style={styles.sectionTitle}>Tarefas</Text>
      <View style={styles.taskInputContainer}>
        <TextInput
          style={styles.taskInput}
          placeholder="Nova tarefa..."
          placeholderTextColor="#666"
          value={taskInput}
          onChangeText={setTaskInput}
        />
        <TouchableOpacity style={styles.btnAddTask} onPress={handleAddTask}>
          <Text style={styles.btnAddTaskText}>Adicionar</Text>
        </TouchableOpacity>
      </View>

      {project.tasks.length === 0 ? (
        <Text style={styles.emptyTasksText}>Nenhuma tarefa cadastrada ainda.</Text>
      ) : (
        project.tasks.map((task) => (
          <View key={task.id} style={styles.taskRow}>
            <TouchableOpacity style={styles.taskCheckbox} onPress={() => toggleTask(project.id, task.id)}>
              <Text style={styles.checkboxText}>{task.completed ? '✓' : ''}</Text>
            </TouchableOpacity>
            <Text style={[styles.taskText, task.completed && styles.taskTextCompleted]}>{task.text}</Text>
            <TouchableOpacity style={styles.btnRemoveTask} onPress={() => removeTask(project.id, task.id)}>
              <Text style={styles.btnRemoveTaskText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Botão de Excluir Projeto */}
      <TouchableOpacity style={styles.btnDelete} onPress={handleDeleteProject} activeOpacity={0.8}>
        <Text style={styles.btnDeleteText}>Excluir Projeto</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// --- CONFIGURAÇÃO DA NAVEGAÇÃO ---
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="light" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#121212' },
            headerTintColor: '#FFFFFF',
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

// --- ESTILOS VISUAIS (PALETA DARK FITNESS) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  listContent: { padding: 16, paddingBottom: 80 },
  detailsContent: { padding: 20, paddingBottom: 40 },

  // Cards da Lista
  card: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 8 },
  cardDescription: { color: '#A0A0A0', fontSize: 14, marginBottom: 12, lineHeight: 20 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingTop: 10, marginTop: 4 },
  cardTasksText: { color: '#888888', fontSize: 12 },

  // Badges
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  // Botão Flutuante (FAB)
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#007AFF', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 5 },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', marginTop: -2 },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#333333' },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#121212', color: '#FFFFFF', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#333333', fontSize: 15 },
  textArea: { height: 80, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  btnCancel: { padding: 12 },
  btnTextCancel: { color: '#A0A0A0', fontWeight: 'bold' },
  btnSave: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  btnTextSave: { color: '#FFFFFF', fontWeight: 'bold' },

  // Tela de Detalhes
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  description: { color: '#A0A0A0', fontSize: 15, lineHeight: 22, marginBottom: 20 },
  sectionTitle: { color: '#FFFFFF', fontSize: 16, fontWeight: 'bold', marginTop: 16, marginBottom: 10 },

  // Seletor de Status
  statusContainer: { flexDirection: 'row', gap: 8, marginBottom: 20 },
  statusOption: { flex: 1, paddingVertical: 10, backgroundColor: '#1E1E1E', borderRadius: 8, borderWidth: 1, borderColor: '#333333', alignItems: 'center' },
  statusOptionActive: { backgroundColor: '#007AFF', borderColor: '#007AFF' },
  statusOptionText: { color: '#A0A0A0', fontSize: 13, fontWeight: '600' },
  statusOptionTextActive: { color: '#FFFFFF', fontWeight: 'bold' },

  // Tarefas
  taskInputContainer: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  taskInput: { flex: 1, backgroundColor: '#1E1E1E', color: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333333' },
  btnAddTask: { backgroundColor: '#007AFF', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  btnAddTaskText: { color: '#FFFFFF', fontWeight: 'bold' },
  emptyTasksText: { color: '#666666', fontStyle: 'italic', marginBottom: 20 },
  taskRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  taskCheckbox: { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#007AFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxText: { color: '#007AFF', fontWeight: 'bold', fontSize: 14 },
  taskText: { flex: 1, color: '#FFFFFF', fontSize: 15 },
  taskTextCompleted: { color: '#666666', textDecorationLine: 'line-through' },
  btnRemoveTask: { padding: 4 },
  btnRemoveTaskText: { color: '#FF3B30', fontSize: 16, fontWeight: 'bold' },

  // Excluir
  btnDelete: { marginTop: 32, backgroundColor: '#FF3B30', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnDeleteText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
});
          
