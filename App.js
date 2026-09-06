import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

// --- CONFIGURAÇÃO DE NOTIFICAÇÕES ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
}

// --- STORE ZUSTAND ---
const useProjectStore = create(
  persist(
    (set) => ({
      projects: [
        {
          id: '1',
          title: 'Dashboard Filiais',
          description: 'Estrutura gerencial do painel',
          dueDate: '15/10/2026',
          status: 'Em Andamento',
          tasks: [
            {
              id: '101',
              text: 'Ajustar paleta clara',
              assignee: 'Luciano',
              dueDate: '06/09/2026',
              dueTime: '10:00',
              notes: 'Usar estilo suave sem azuis fortes',
              completed: false,
            },
            {
              id: '102',
              text: 'Revisão de estoque',
              assignee: 'Luciano',
              dueDate: '12/09/2026',
              dueTime: '14:00',
              notes: '',
              completed: true,
            },
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

      addTask: (projectId, taskText, assignee, dueDate, dueTime, notes) =>
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
                    assignee: assignee || 'Geral',
                    dueDate: dueDate || '',
                    dueTime: dueTime || '09:00',
                    notes: notes || '',
                    completed: false,
                  },
                ],
              };
            }
            return p;
          }),
        })),

      updateTask: (projectId, taskId, updatedData) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                tasks: p.tasks.map((t) => (t.id === taskId ? { ...t, ...updatedData } : t)),
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
      name: 'projects-light-minimal-v2',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

const Stack = createNativeStackNavigator();

// --- TELA PRINCIPAL ---
function HomeScreen({ navigation }) {
  const { projects, addProject } = useProjectStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    requestNotificationPermissions();
  }, []);

  const activeProjects = projects.filter((p) => p.status !== 'Concluído');

  // Cálculos de Indicadores
  const allTasks = activeProjects.flatMap((p) => p.tasks);
  const completedTasksCount = allTasks.filter((t) => t.completed).length;
  const totalTasksCount = allTasks.length;
  const progressPercentage = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const handleCreate = () => {
    if (title.trim()) {
      addProject(title.trim(), description.trim(), dueDate.trim());
      setTitle('');
      setDescription('');
      setDueDate('');
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollPadding}>
        {/* Painel de Avisos & Gráfico de Execução */}
        <View style={styles.metricsCard}>
          <Text style={styles.metricsTitle}>Desempenho Geral</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressText}>{progressPercentage}% das tarefas concluídas ({completedTasksCount}/{totalTasksCount})</Text>

          <View style={styles.metricsGrid}>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{allTasks.length}</Text>
              <Text style={styles.metricLabel}>Total Ativas</Text>
            </View>
            <View style={styles.metricItem}>
              <Text style={styles.metricValue}>{activeProjects.length}</Text>
              <Text style={styles.metricLabel}>Projetos</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionMainTitle}>Projetos Ativos</Text>
          <TouchableOpacity onPress={() => navigation.navigate('History')}>
            <Text style={styles.historyLinkText}>Ver Histórico ›</Text>
          </TouchableOpacity>
        </View>

        {activeProjects.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
            activeOpacity={0.8}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <View style={styles.softBadge}>
                <Text style={styles.softBadgeText}>{item.status}</Text>
              </View>
            </View>
            {item.description ? <Text style={styles.cardDescription}>{item.description}</Text> : null}
            <View style={styles.cardFooter}>
              <Text style={styles.cardFooterText}>Prazo: {item.dueDate}</Text>
              <Text style={styles.cardFooterText}>{item.tasks.length} tarefas</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.85}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal Criar Projeto */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Novo Projeto</Text>
            <TextInput style={styles.input} placeholder="Nome do Projeto" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Descrição" value={description} onChangeText={setDescription} />
            <TextInput style={styles.input} placeholder="Prazo Geral (ex: 20/10/2026)" value={dueDate} onChangeText={setDueDate} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.btnSecondary} onPress={() => setModalVisible(false)}>
                <Text style={styles.btnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnPrimary} onPress={handleCreate}>
                <Text style={styles.btnPrimaryText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// --- TELA DE HISTÓRICO ---
function HistoryScreen({ navigation }) {
  const { projects } = useProjectStore();
  const completedProjects = projects.filter((p) => p.status === 'Concluído');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
      {completedProjects.length === 0 ? (
        <Text style={styles.emptyText}>Nenhum projeto concluído ainda.</Text>
      ) : (
        completedProjects.map((item) => (
          <TouchableOpacity
            key={item.id}
            style={styles.card}
            onPress={() => navigation.navigate('ProjectDetails', { projectId: item.id })}
          >
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardDescription}>{item.description}</Text>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

// --- TELA DE DETALHES E EDITAR TAREFA ---
function ProjectDetailsScreen({ route, navigation }) {
  const { projectId } = route.params;
  const project = useProjectStore((state) => state.projects.find((p) => p.id === projectId));
  const { removeProject, updateProjectStatus, addTask, toggleTask, removeTask, updateTask } = useProjectStore();

  const [taskText, setTaskText] = useState('');
  const [assignee, setAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [notes, setNotes] = useState('');

  // Modal de edição da tarefa
  const [editingTask, setEditingTask] = useState(null);

  if (!project) return null;

  const handleAddTask = () => {
    if (taskText.trim()) {
      addTask(project.id, taskText.trim(), assignee.trim(), taskDueDate.trim(), '09:00', notes.trim());
      setTaskText('');
      setAssignee('');
      setTaskDueDate('');
      setNotes('');
    }
  };

  const handleSaveEditedTask = () => {
    if (editingTask) {
      updateTask(project.id, editingTask.id, editingTask);
      setEditingTask(null);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollPadding}>
      <Text style={styles.projectTitle}>{project.title}</Text>
      <Text style={styles.projectDescription}>{project.description}</Text>

      {/* Selector de Status */}
      <View style={styles.statusSegmented}>
        {['Pendente', 'Em Andamento', 'Concluído'].map((st) => (
          <TouchableOpacity
            key={st}
            style={[styles.segmentBtn, project.status === st && styles.segmentBtnActive]}
            onPress={() => updateProjectStatus(project.id, st)}
          >
            <Text style={[styles.segmentText, project.status === st && styles.segmentTextActive]}>{st}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Formulário de Tarefas */}
      <Text style={styles.sectionMainTitle}>Adicionar Tarefa</Text>
      <View style={styles.cardForm}>
        <TextInput style={styles.input} placeholder="O que precisa ser feito?" value={taskText} onChangeText={setTaskText} />
        <View style={styles.formRow}>
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Responsável" value={assignee} onChangeText={setAssignee} />
          <TextInput style={[styles.input, { flex: 1 }]} placeholder="Data (dd/mm/aaaa)" value={taskDueDate} onChangeText={setTaskDueDate} />
        </View>
        <TextInput style={styles.input} placeholder="Anotações / Observações" value={notes} onChangeText={setNotes} />
        <TouchableOpacity style={styles.btnPrimary} onPress={handleAddTask}>
          <Text style={styles.btnPrimaryText}>Adicionar Tarefa</Text>
        </TouchableOpacity>
      </View>

      {/* Lista de Tarefas */}
      <Text style={styles.sectionMainTitle}>Tarefas do Projeto</Text>
      {project.tasks.map((t) => (
        <View key={t.id} style={styles.taskCardItem}>
          <TouchableOpacity style={styles.checkCircle} onPress={() => toggleTask(project.id, t.id)}>
            <Text style={styles.checkIcon}>{t.completed ? '✓' : ''}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={{ flex: 1 }} onPress={() => setEditingTask(t)}>
            <Text style={[styles.taskTitle, t.completed && styles.taskCompleted]}>{t.text}</Text>
            <Text style={styles.taskSubtext}>👤 {t.assignee} {t.dueDate ? `| 🗓 ${t.dueDate}` : ''}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => removeTask(project.id, t.id)}>
            <Text style={styles.deleteIconText}>✕</Text>
          </TouchableOpacity>
        </View>
      ))}

      <TouchableOpacity style={styles.btnOutlineDanger} onPress={() => { removeProject(project.id); navigation.goBack(); }}>
        <Text style={styles.btnOutlineDangerText}>Remover Projeto</Text>
      </TouchableOpacity>

      {/* Modal de Edição da Tarefa */}
      {editingTask && (
        <Modal visible animationType="slide" transparent>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Editar Tarefa</Text>
              <TextInput
                style={styles.input}
                value={editingTask.text}
                onChangeText={(text) => setEditingTask({ ...editingTask, text })}
              />
              <TextInput
                style={styles.input}
                value={editingTask.assignee}
                onChangeText={(assignee) => setEditingTask({ ...editingTask, assignee })}
              />
              <TextInput
                style={styles.input}
                value={editingTask.dueDate}
                onChangeText={(dueDate) => setEditingTask({ ...editingTask, dueDate })}
              />
              <TextInput
                style={styles.input}
                value={editingTask.notes}
                onChangeText={(notes) => setEditingTask({ ...editingTask, notes })}
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.btnSecondary} onPress={() => setEditingTask(null)}>
                  <Text style={styles.btnSecondaryText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnPrimary} onPress={handleSaveEditedTask}>
                  <Text style={styles.btnPrimaryText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <StatusBar style="dark" />
        <Stack.Navigator
          initialRouteName="Home"
          screenOptions={{
            headerStyle: { backgroundColor: '#FAFAFA' },
            headerTintColor: '#1F2937',
            headerTitleStyle: { fontWeight: '600', fontSize: 17 },
            headerTitleAlign: 'center',
            contentStyle: { backgroundColor: '#F3F4F6' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Projetos e Tarefas' }} />
          <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'Projetos Concluídos' }} />
          <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} options={{ title: 'Painel do Item' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  scrollPadding: { padding: 16 },
  emptyText: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },

  metricsCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 20, borderWidth: 1, borderColor: '#E5E7EB' },
  metricsTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 10 },
  progressBarBackground: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#4B5563' },
  progressText: { fontSize: 12, color: '#6B7280', marginTop: 6, textAlign: 'right' },
  metricsGrid: { flexDirection: 'row', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  metricItem: { flex: 1, alignItems: 'center' },
  metricValue: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  metricLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionMainTitle: { fontSize: 16, fontWeight: '600', color: '#1F2937', marginVertical: 8 },
  historyLinkText: { fontSize: 13, color: '#4B5563', fontWeight: '500' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardDescription: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F3F4F6' },
  cardFooterText: { fontSize: 12, color: '#9CA3AF' },

  softBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  softBadgeText: { fontSize: 12, color: '#4B5563', fontWeight: '500' },

  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#374151', width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: '#FFFFFF', fontSize: 26, fontWeight: '300' },

  statusSegmented: { flexDirection: 'row', backgroundColor: '#E5E7EB', borderRadius: 8, padding: 3, marginVertical: 12 },
  segmentBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  segmentBtnActive: { backgroundColor: '#FFFFFF' },
  segmentText: { fontSize: 13, color: '#6B7280' },
  segmentTextActive: { color: '#111827', fontWeight: '600' },

  cardForm: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 16 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 8, padding: 10, fontSize: 14, color: '#111827', marginBottom: 8 },
  formRow: { flexDirection: 'row', gap: 8 },

  btnPrimary: { backgroundColor: '#374151', padding: 12, borderRadius: 8, alignItems: 'center', marginTop: 4 },
  btnPrimaryText: { color: '#FFFFFF', fontWeight: '600', fontSize: 14 },
  btnSecondary: { padding: 12 },
  btnSecondaryText: { color: '#6B7280', fontWeight: 
