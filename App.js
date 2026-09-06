import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- STORE ZUSTAND ---
const useProjectStore = create(
  persist(
    (set) => ({
      projects: [
        {
          id: '1',
          title: 'Dashboard',
          description: 'Definir dashboards das filiais',
          dueDate: '15/10/2026',
          status: 'Pendente',
          tasks: [
            { id: '101', text: 'Definir telas', assignee: 'Luciano', dueDate: '05/10/2026', completed: false },
            { id: '102', text: 'Definir tema', assignee: 'Luciano', dueDate: '01/10/2026', completed: true },
          ],
        },
      ],

      addProject: (title, description, dueDate) =>
        set((state) => ({
          projects: [
            ...state.projects,
            {
              id: Date.now().toString(),
              title,
              description,
              dueDate: dueDate || 'Sem prazo',
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

      addTask: (projectId, taskText, assignee, dueDate) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                tasks: [
                  ...p.tasks,
                  {
                    id: Date.now().toString(),
                    text: taskText,
                    assignee: assignee || 'Não atribuído',
                    dueDate: dueDate || 'Sem data',
                    completed: false,
                  },
                ],
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
                tasks: p.tasks.map((t) =>
                  t.id === taskId ? { ...t, completed: !t.completed } : t
                ),
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
      name: 'projects-light-v1',
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
  const [dueDate, setDueDate] = useState('');

  const handleCreate = () => {
    if (title.trim()) {
      addProject(title.trim(), description.trim(), dueDate.trim());
      setTitle('');
      setDescription('');
      setDueDate('');
      setModalVisible(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Concluído': return '#34C759';
      case 'Em Andamento': return '#007AFF';
      default: return '#FF9500';
    }
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '18' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>{item.status}</Text>
              </View>
            </View>

            {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}

            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>🗓 Prazo Geral: {item.dueDate}</Text>
              <Text style={styles.cardFooterText}>{item.tasks.length} tarefas</Text>
            </View>
          </TouchableOpacity>
        )}
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
              placeholder="Nome do Projeto"
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

            <TextInput
              style={styles.input}
              placeholder="Prazo Total do Projeto (ex: 20/10/2026)"
              placeholderTextColor="#888"
              value={dueDate}
              onChangeText={setDueDate}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnTextCancel}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleCreate}>
                <Text style={styles.btnTextSave}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- TELA DE DETALHES ---
function ProjectDetailsScreen({ route, navigation }) {
  const { projectId } = route.params;
  const project = useProjectStore((state) => state.projects.find((p) => p.id === projectId));
  const { removeProject, updateProjectStatus, addTask, toggleTask, removeTask } = useProjectStore();

  const [taskText, setTaskText] = useState('');
  const [assignee, setAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');

  if (!project) return null;

  const handleAddTask = () => {
    if (taskText.trim()) {
      addTask(project.id, taskText.trim(), assignee.trim(), taskDueDate.trim());
      setTaskText('');
      setAssignee('');
      setTaskDueDate('');
    }
  };

  const statusOptions = ['Pendente', 'Em Andamento', 'Concluído'];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.detailsContent}>
      {/* Título, Descrição e Prazo Geral */}
      <Text style={styles.projectTitle}>{project.title}</Text>
      {project.description ? <Text style={styles.projectDescription}>{project.description}</Text> : null}
      <Text style={styles.projectDueDate}>🗓 Prazo Total: {project.dueDate || 'Sem prazo definido'}</Text>

      {/* Status do Projeto */}
      <Text style={styles.sectionTitle}>Status do Projeto</Text>
      <View style={styles.statusRow}>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.statusBtn, project.status === status && styles.statusBtnActive]}
            onPress={() => updateProjectStatus(project.id, status)}
          >
            <Text style={[styles.statusBtnText, project.status === status && styles.statusBtnTextActive]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Seção de Tarefas */}
      <Text style={styles.sectionTitle}>Tarefas</Text>

      {/* Formulário de Adicionar Tarefa com Prazo e Responsável */}
      <View style={styles.addTaskForm}>
        <TextInput
          style={styles.input}
          placeholder="Nova tarefa..."
          placeholderTextColor="#888"
          value={taskText}
          onChangeText={setTaskText}
        />
        <View style={styles.formRow}>
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Responsável"
            placeholderTextColor="#888"
            value={assignee}
            onChangeText={setAssignee}
          />
          <TextInput
            style={[styles.input, { flex: 1, marginBottom: 0 }]}
            placeholder="Prazo"
            placeholderTextColor="#888"
            value={taskDueDate}
            onChangeText={setTaskDueDate}
          />
        </View>
        <TouchableOpacity style={styles.btnAdd} onPress={handleAddTask}>
          <Text style={styles.btnAddText}>Adicionar Tarefa</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Tarefas Estilizada */}
      {project.tasks.map((task) => (
        <View key={task.id} style={styles.taskCard}>
          <TouchableOpacity style={styles.checkbox} onPress={() => toggleTask(project.id, task.id)}>
            <Text style={styles.checkboxMark}>{task.completed ? '✓' : ''}</Text>
          </TouchableOpacity>

          <View style={styles.taskInfo}>
            <Text style={[styles.taskTitleText, task.completed && styles.completedText]}>
              {task.text}
            </Text>
            <Text style={styles.taskSubText}>
              👤 {task.assignee} | 🗓 {task.dueDate}
            </Text>
          </View>

          <TouchableOpacity onPress={() => removeTask(project.id, task.id)}>
            <Text style={styles.removeText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      {/* Botão Excluir */}
      <TouchableOpacity
        style={styles.btnDelete}
        onPress={() => {
          removeProject(project.id);
          navigation.goBack();
        }}
      >
        <Text style={styles.btnDeleteText}>Excluir Projeto</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// --- NAVEGAÇÃO E TEMAS ---
export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#FFFFFF' },
            headerTintColor: '#000000',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#F8F9FA' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Projetos' }} />
          <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} options={{ title: 'Detalhes' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

// --- ESTILOS VISUAIS TEMA CLARO (LIGHT) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  listContent: { padding: 16 },
  detailsContent: { padding: 20 },

  // Cards Home
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E9ECEF' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#1A1A1A' },
  cardDescription: { fontSize: 14, color: '#6C757D', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F1F3F5' },
  cardFooterText: { fontSize: 12, color: '#868E96' },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  // FAB
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#007AFF', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 3 },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold' },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12 },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1A1A1A' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 12 },
  btnCancel: { padding: 10 },
  btnTextCancel: { color: '#6C757D', fontWeight: 'bold' },
  btnSave: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 8 },
  btnTextSave: { color: '#FFFFFF', fontWeight: 'bold' },

  // Detalhes do Projeto
  projectTitle: { fontSize: 24, fontWeight: 'bold', color: '#000000' },
  projectDescription: { fontSize: 15, color: '#6C757D', marginTop: 4 },
  projectDueDate: { fontSize: 13, color: '#007AFF', fontWeight: '600', marginTop: 8 },

  sectionTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A1A1A', marginTop: 24, marginBottom: 12 },

  // Status
  statusRow: { flexDirection: 'row', gap: 8 },
  statusBtn: { flex: 1, paddingVertical: 10, backgroundColor: '#E9ECEF', borderRadius: 8, alignItems: 'center' },
  statusBtnActive: { backgroundColor: '#007AFF' },
  statusBtnText: { color: '#495057', fontSize: 13, fontWeight: '600' },
  statusBtnTextActive: { color: '#FFFFFF', fontWeight: 'bold' },

  // Form de Tarefa
  addTaskForm: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E9ECEF', marginBottom: 16 },
  input: { backgroundColor: '#F8F9FA', color: '#000000', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#DEE2E6', marginBottom: 8, fontSize: 14 },
  formRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  btnAdd: { backgroundColor: '#007AFF', padding: 12, borderRadius: 8, alignItems: 'center' },
  btnAddText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 14 },

  // Lista de Tarefas
  taskCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', padding: 12, borderRadius: 10, marginBottom: 8, borderWidth: 1, borderColor: '#E9ECEF' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#007AFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxMark: { color: '#007AFF', fontWeight: 'bold', fontSize: 12 },
  taskInfo: { flex: 1 },
  taskTitleText: { fontSize: 15, color: '#212529', fontWeight: '500' },
  completedText: { textDecorationLine: 'line-through', color: '#ADB5BD' },
  taskSubText: { fontSize: 12, color: '#868E96', marginTop: 2 },
  removeText: { color: '#FF3B30', fontSize: 18, fontWeight: 'bold', paddingHorizontal: 8 },

  // Excluir
  btnDelete: { marginTop: 32, backgroundColor: '#FF3B30', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnDeleteText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
});
                                                                  
