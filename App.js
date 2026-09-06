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
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// --- STORE ZUSTAND ESTILO MONDAY ---
const useProjectStore = create(
  persist(
    (set) => ({
      projects: [
        {
          id: '1',
          title: 'Pipeline CI/CD Android',
          owner: 'Luciano Korn',
          priority: 'Alta',
          status: 'Concluído',
          dueDate: '10/09/2026',
          description: 'Ajustes no fluxo automatizado via GitHub Actions.',
          notes: 'Builds de preview configurados para gerar APK sem erros de Kotlin.',
          tasks: [
            { id: '101', text: 'Ajustar dependências no package.json', completed: true },
            { id: '102', text: 'Validar build no EAS CLI', completed: true },
          ],
        },
        {
          id: '2',
          title: 'Módulo de Gestão Estilo Monday',
          owner: 'Luciano Korn',
          priority: 'Média',
          status: 'Em Andamento',
          dueDate: '25/09/2026',
          description: 'Adicionar colunas de responsável, prioridade, prazos e anotações.',
          notes: 'Links úteis e dados do projeto integrados na mesma tela.',
          tasks: [
            { id: '201', text: 'Adicionar campo de responsável no formulário', completed: true },
            { id: '202', text: 'Criar seletor de prioridade (Alta/Média/Baixa)', completed: true },
          ],
        },
      ],

      addProject: (newProject) =>
        set((state) => ({
          projects: [
            ...state.projects,
            {
              id: Date.now().toString(),
              status: 'Pendente',
              priority: newProject.priority || 'Média',
              owner: newProject.owner || 'Não atribuído',
              dueDate: newProject.dueDate || 'Sem prazo',
              notes: newProject.notes || '',
              description: newProject.description || '',
              tasks: [],
              ...newProject,
            },
          ],
        })),

      updateProject: (id, updatedFields) =>
        set((state) => ({
          projects: state.projects.map((p) =>
            p.id === id ? { ...p, ...updatedFields } : p
          ),
        })),

      removeProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
        })),

      addTask: (projectId, taskText) =>
        set((state) => ({
          projects: state.projects.map((p) => {
            if (p.id === projectId) {
              return {
                ...p,
                tasks: [
                  ...p.tasks,
                  { id: Date.now().toString(), text: taskText, completed: false },
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
      name: 'monday-projects-storage-v3',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

const Stack = createNativeStackNavigator();

// CORES E HELPERS
const getStatusColor = (status) => {
  switch (status) {
    case 'Concluído': return '#34C759';
    case 'Em Andamento': return '#007AFF';
    default: return '#FF9500';
  }
};

const getPriorityColor = (priority) => {
  switch (priority) {
    case 'Alta': return '#FF3B30';
    case 'Média': return '#FF9500';
    default: return '#8E8E93';
  }
};

// --- TELA PRINCIPAL (HOME) ---
function HomeScreen({ navigation }) {
  const { projects, addProject } = useProjectStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [priority, setPriority] = useState('Média');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');

  const handleCreate = () => {
    if (title.trim()) {
      addProject({
        title: title.trim(),
        owner: owner.trim() || 'Luciano Korn',
        priority,
        dueDate: dueDate.trim() || 'Sem prazo',
        description: description.trim(),
        notes: notes.trim(),
      });
      setTitle('');
      setOwner('');
      setPriority('Média');
      setDueDate('');
      setDescription('');
      setNotes('');
      setModalVisible(false);
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

              <View style={styles.mondayRow}>
                <Text style={styles.mondayText}>👤 {item.owner}</Text>
                <View style={[styles.badge, { backgroundColor: getPriorityColor(item.priority) + '22' }]}>
                  <Text style={[styles.badgeText, { color: getPriorityColor(item.priority) }]}>
                    Prioridade: {item.priority}
                  </Text>
                </View>
              </View>

              {item.description ? (
                <Text style={styles.cardDescription} numberOfLines={2}>
                  {item.description}
                </Text>
              ) : null}

              <View style={styles.cardFooter}>
                <Text style={styles.cardInfoText}>🗓 {item.dueDate}</Text>
                <Text style={styles.cardInfoText}>
                  {totalTasks > 0 ? `☑ ${completedTasks}/${totalTasks} subitens` : 'Sem subtarefas'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)} activeOpacity={0.8}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Modal Criar Projeto estilo Monday */}
      <Modal visible={modalVisible} animationType="fade" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ justifyContent: 'center', flexGrow: 1 }}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Novo Item / Projeto</Text>

              <TextInput
                style={styles.input}
                placeholder="Nome do Projeto *"
                placeholderTextColor="#666"
                value={title}
                onChangeText={setTitle}
              />

              <TextInput
                style={styles.input}
                placeholder="Responsável (ex: Luciano Korn)"
                placeholderTextColor="#666"
                value={owner}
                onChangeText={setOwner}
              />

              <Text style={styles.fieldLabel}>Prioridade:</Text>
              <View style={styles.prioritySelector}>
                {['Baixa', 'Média', 'Alta'].map((p) => (
                  <TouchableOpacity
                    key={p}
                    style={[styles.priorityBtn, priority === p && { backgroundColor: getPriorityColor(p) }]}
                    onPress={() => setPriority(p)}
                  >
                    <Text style={[styles.priorityBtnText, priority === p && { color: '#FFF' }]}>{p}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput
                style={styles.input}
                placeholder="Prazo (ex: 20/10/2026)"
                placeholderTextColor="#666"
                value={dueDate}
                onChangeText={setDueDate}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descrição resumida"
                placeholderTextColor="#666"
                multiline
                numberOfLines={2}
                value={description}
                onChangeText={setDescription}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Anotações Gerais / Links / Observações"
                placeholderTextColor="#666"
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity style={styles.btnCancel} onPress={() => setModalVisible(false)}>
                  <Text style={styles.btnTextCancel}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.btnSave} onPress={handleCreate}>
                  <Text style={styles.btnTextSave}>Criar Item</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// --- TELA DE DETALHES E EDIÇÃO COMPLETA ---
function ProjectDetailsScreen({ route, navigation }) {
  const { projectId } = route.params;
  const project = useProjectStore((state) => state.projects.find((p) => p.id === projectId));
  const { updateProject, removeProject, addTask, toggleTask, removeTask } = useProjectStore();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [owner, setOwner] = useState('');
  const [priority, setPriority] = useState('Média');
  const [dueDate, setDueDate] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [taskInput, setTaskInput] = useState('');

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setOwner(project.owner || '');
      setPriority(project.priority || 'Média');
      setDueDate(project.dueDate || '');
      setDescription(project.description || '');
      setNotes(project.notes || '');
    }
  }, [project]);

  if (!project) return null;

  const handleSaveEdits = () => {
    if (title.trim()) {
      updateProject(project.id, {
        title: title.trim(),
        owner: owner.trim(),
        priority,
        dueDate: dueDate.trim(),
        description: description.trim(),
        notes: notes.trim(),
      });
      setIsEditing(false);
    }
  };

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
      <View style={styles.headerRow}>
        <Text style={styles.sectionHeaderTitle}>Painel do Item</Text>
        <TouchableOpacity
          style={styles.btnEditToggle}
          onPress={() => {
            if (isEditing) handleSaveEdits();
            else setIsEditing(true);
          }}
        >
          <Text style={styles.btnEditToggleText}>
            {isEditing ? 'Salvar Edição' : 'Editar Campos'}
          </Text>
        </TouchableOpacity>
      </View>

      {isEditing ? (
        <View style={styles.editCard}>
          <Text style={styles.fieldLabel}>Título:</Text>
          <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholderTextColor="#666" />

          <Text style={styles.fieldLabel}>Responsável:</Text>
          <TextInput style={styles.input} value={owner} onChangeText={setOwner} placeholderTextColor="#666" />

          <Text style={styles.fieldLabel}>Prioridade:</Text>
          <View style={styles.prioritySelector}>
            {['Baixa', 'Média', 'Alta'].map((p) => (
              <TouchableOpacity
                key={p}
                style={[styles.priorityBtn, priority === p && { backgroundColor: getPriorityColor(p) }]}
                onPress={() => setPriority(p)}
              >
                <Text style={[styles.priorityBtnText, priority === p && { color: '#FFF' }]}>{p}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.fieldLabel}>Prazo:</Text>
          <TextInput style={styles.input} value={dueDate} onChangeText={setDueDate} placeholderTextColor="#666" />

          <Text style={styles.fieldLabel}>Descrição:</Text>
          <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} multiline numberOfLines={2} placeholderTextColor="#666" />

          <Text style={styles.fieldLabel}>Anotações & Documentação:</Text>
          <TextInput style={[styles.input, styles.textAreaLarge]} value={notes} onChangeText={setNotes} multiline numberOfLines={5} placeholderTextColor="#666" />
        </View>
      ) : (
        <View style={styles.viewCard}>
          <Text style={styles.title}>{project.title}</Text>

          <View style={styles.mondayMetaGrid}>
            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Responsável</Text>
              <Text style={styles.metaValue}>👤 {project.owner || 'Não definido'}</Text>
            </View>

            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Prioridade</Text>
              <Text style={[styles.metaValue, { color: getPriorityColor(project.priority) }]}>
                ★ {project.priority}
              </Text>
            </View>

            <View style={styles.metaBox}>
              <Text style={styles.metaLabel}>Prazo</Text>
              <Text style={styles.metaValue}>🗓 {project.dueDate}</Text>
            </View>
          </View>

          {project.description ? (
            <Text style={styles.description}>{project.description}</Text>
          ) : null}

          <Text style={styles.sectionTitle}>Anotações / Bloco de Notas</Text>
          <View style={styles.notesBox}>
            <Text style={styles.notesText}>
              {project.notes ? project.notes : 'Nenhuma anotação vinculada a este item.'}
            </Text>
          </View>
        </View>
      )}

      {/* Coluna de Status */}
      <Text style={styles.sectionTitle}>Status do Item</Text>
      <View style={styles.statusContainer}>
        {statusOptions.map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.statusOption, project.status === status && { backgroundColor: getStatusColor(status), borderColor: getStatusColor(status) }]}
            onPress={() => updateProject(project.id, { status })}
          >
            <Text style={[styles.statusOptionText, project.status === status && { color: '#FFF' }]}>
              {status}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Checklist / Subtarefas */}
      <Text style={styles.sectionTitle}>Subtarefas / Checklist</Text>
      <View style={styles.taskInputContainer}>
        <TextInput
          style={styles.taskInput}
          placeholder="Adicionar nova subtarefa..."
          placeholderTextColor="#666"
          value={taskInput}
          onChangeText={setTaskInput}
        />
        <TouchableOpacity style={styles.btnAddTask} onPress={handleAddTask}>
          <Text style={styles.btnAddTaskText}>+</Text>
        </TouchableOpacity>
      </View>

      {project.tasks.length === 0 ? (
        <Text style={styles.emptyTasksText}>Nenhuma subtarefa registrada.</Text>
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

      <TouchableOpacity style={styles.btnDelete} onPress={handleDeleteProject} activeOpacity={0.8}>
        <Text style={styles.btnDeleteText}>Excluir Item</Text>
      </TouchableOpacity>
    </ScrollView>
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
            headerTintColor: '#FFFFFF',
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: '#121212' },
          }}
        >
          <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Projetos & Tarefas' }} />
          <Stack.Screen name="ProjectDetails" component={ProjectDetailsScreen} options={{ title: 'Painel do Item' }} />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212' },
  listContent: { padding: 16, paddingBottom: 80 },
  detailsContent: { padding: 20, paddingBottom: 40 },

  card: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2A2A2A' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardTitle: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold', flex: 1, marginRight: 8 },
  mondayRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  mondayText: { color: '#A0A0A0', fontSize: 13, fontWeight: '600' },
  cardDescription: { color: '#888888', fontSize: 14, marginBottom: 12 },
  cardFooter: { borderTopWidth: 1, borderTopColor: '#2A2A2A', paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between' },
  cardInfoText: { color: '#888888', fontSize: 12 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: 'bold' },

  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: '#007AFF', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  fabText: { color: '#FFFFFF', fontSize: 28, fontWeight: 'bold', marginTop: -2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', padding: 20 },
  modalContent: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 12, borderWidth: 1, borderColor: '#333333' },
  modalTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#121212', color: '#FFFFFF', padding: 12, borderRadius: 8, marginBottom: 12, borderWidth: 1, borderColor: '#333333', fontSize: 15 },
  textArea: { height: 60, textAlignVertical: 'top' },
  textAreaLarge: { height: 100, textAlignVertical: 'top' },
  modalButtons: { flexDirection: 'row', justifyContent: 'flex-end', gap: 12, marginTop: 8 },
  btnCancel: { padding: 12 },
  btnTextCancel: { color: '#A0A0A0', fontWeight: 'bold' },
  btnSave: { backgroundColor: '#007AFF', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8 },
  btnTextSave: { color: '#FFFFFF', fontWeight: 'bold' },

  prioritySelector: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  priorityBtn: { flex: 1, paddingVertical: 8, backgroundColor: '#121212', borderRadius: 6, alignItems: 'center', borderWidth: 1, borderColor: '#333333' },
  priorityBtnText: { color: '#888888', fontWeight: 'bold', fontSize: 12 },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionHeaderTitle: { color: '#888888', fontSize: 13, textTransform: 'uppercase', fontWeight: 'bold' },
  btnEditToggle: { backgroundColor: '#007AFF', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  btnEditToggleText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 13 },

  viewCard: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#2A2A2A', marginBottom: 16 },
  editCard: { backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#007AFF', marginBottom: 16 },
  fieldLabel: { color: '#A0A0A0', fontSize: 12, fontWeight: '600', marginBottom: 4 },

  title: { color: '#FFFFFF', fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  mondayMetaGrid: { flexDirection: 'row', gap: 8, marginBottom: 16, backgroundColor: '#121212', padding: 12, borderRadius: 8 },
  metaBox: { flex: 1 },
  metaLabel: { color: '#666666', fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 2 },
  metaValue: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },

  description: { color: '#CCCCCC', fontSize: 14, lineHeight: 20, marginBottom: 16 },
  notesBox: { backgroundColor: '#121212', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  notesText: { color: '#A0A0A0', fontSize: 13, lineHeight: 18 },

  sectionTitle: { color: '#FFFFFF', fontSize: 15, fontWeight: 'bold', marginTop: 16, marginBottom: 10 },

  statusContainer: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusOption: { flex: 1, paddingVertical: 10, backgroundColor: '#1E1E1E', borderRadius: 8, borderWidth: 1, borderColor: '#333333', alignItems: 'center' },
  statusOptionText: { color: '#A0A0A0', fontSize: 12, fontWeight: '600' },

  taskInputContainer: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  taskInput: { flex: 1, backgroundColor: '#1E1E1E', color: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#333333' },
  btnAddTask: { backgroundColor: '#007AFF', paddingHorizontal: 16, justifyContent: 'center', borderRadius: 8 },
  btnAddTaskText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 18 },
  emptyTasksText: { color: '#666666', fontStyle: 'italic', marginBottom: 16 },
  taskRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 12, borderRadius: 8, marginBottom: 8, borderWidth: 1, borderColor: '#2A2A2A' },
  taskCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#007AFF', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  checkboxText: { color: '#007AFF', fontWeight: 'bold', fontSize: 12 },
  taskText: { flex: 1, color: '#FFFFFF', fontSize: 14 },
  taskTextCompleted: { color: '#666666', textDecorationLine: 'line-through' },
  btnRemoveTask: { padding: 4 },
  btnRemoveTaskText: { color: '#FF3B30', fontSize: 14, fontWeight: 'bold' },

  btnDelete: { marginTop: 28, backgroundColor: '#FF3B30', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnDeleteText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 15 },
});
