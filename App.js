import React, { useState, useEffect } from 'react';

import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';

import {
  NavigationContainer,
} from '@react-navigation/native';

import {
  createNativeStackNavigator,
} from '@react-navigation/native-stack';

import { StatusBar } from 'expo-status-bar';

import {
  SafeAreaProvider,
} from 'react-native-safe-area-context';

import { create } from 'zustand';

import {
  persist,
  createJSONStorage,
} from 'zustand/middleware';

import AsyncStorage from '@react-native-async-storage/async-storage';

import * as Notifications from 'expo-notifications';


// ============================================================
// NOTIFICAÇÕES
// ============================================================

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();

    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } =
        await Notifications.requestPermissionsAsync();

      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (error) {
    console.log('Erro nas notificações:', error);
    return false;
  }
}


// ============================================================
// STORE
// ============================================================

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


      // --------------------------------------------------------
      // PROJETOS
      // --------------------------------------------------------

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
          projects: state.projects.filter(
            (project) => project.id !== id
          ),
        })),


      updateProjectStatus: (id, status) =>
        set((state) => ({
          projects: state.projects.map((project) =>
            project.id === id
              ? {
                  ...project,
                  status,
                }
              : project
          ),
        })),


      // --------------------------------------------------------
      // TAREFAS
      // --------------------------------------------------------

      addTask: (
        projectId,
        taskText,
        assignee,
        dueDate,
        dueTime,
        notes
      ) =>
        set((state) => ({
          projects: state.projects.map((project) => {

            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,

              tasks: [
                ...project.tasks,

                {
                  id:
                    Date.now().toString() +
                    Math.random().toString(36).substring(2, 7),

                  text: taskText,

                  assignee:
                    assignee || 'Geral',

                  dueDate:
                    dueDate || '',

                  dueTime:
                    dueTime || '09:00',

                  notes:
                    notes || '',

                  completed: false,
                },
              ],
            };
          }),
        })),


      // --------------------------------------------------------
      // ATUALIZAR TAREFA
      // --------------------------------------------------------

      updateTask: (
        projectId,
        taskId,
        updatedData
      ) =>
        set((state) => ({
          projects: state.projects.map((project) => {

            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,

              tasks: project.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      ...updatedData,
                    }
                  : task
              ),
            };
          }),
        })),


      // --------------------------------------------------------
      // CONCLUIR / DESCONCLUIR
      // --------------------------------------------------------

      toggleTask: (
        projectId,
        taskId
      ) =>
        set((state) => ({
          projects: state.projects.map((project) => {

            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,

              tasks: project.tasks.map((task) =>
                task.id === taskId
                  ? {
                      ...task,
                      completed: !task.completed,
                    }
                  : task
              ),
            };
          }),
        })),


      // --------------------------------------------------------
      // EXCLUIR TAREFA
      // --------------------------------------------------------

      removeTask: (
        projectId,
        taskId
      ) =>
        set((state) => ({
          projects: state.projects.map((project) => {

            if (project.id !== projectId) {
              return project;
            }

            return {
              ...project,

              tasks: project.tasks.filter(
                (task) => task.id !== taskId
              ),
            };
          }),
        })),
    }),

    {
      name: 'projects-light-minimal-v2',

      storage: createJSONStorage(
        () => AsyncStorage
      ),
    }
  )
);


const Stack =
  createNativeStackNavigator();


// ============================================================
// HOME
// ============================================================

function HomeScreen({ navigation }) {

  const {
    projects,
    addProject,
  } = useProjectStore();


  const [modalVisible, setModalVisible] =
    useState(false);

  const [title, setTitle] =
    useState('');

  const [description, setDescription] =
    useState('');

  const [dueDate, setDueDate] =
    useState('');


  useEffect(() => {
    requestNotificationPermissions();
  }, []);


  const activeProjects =
    projects.filter(
      (project) =>
        project.status !== 'Concluído'
    );


  // ----------------------------------------------------------
  // INDICADORES
  // ----------------------------------------------------------

  const allTasks =
    activeProjects.flatMap(
      (project) => project.tasks
    );


  const completedTasksCount =
    allTasks.filter(
      (task) => task.completed
    ).length;


  const totalTasksCount =
    allTasks.length;


  const progressPercentage =
    totalTasksCount > 0
      ? Math.round(
          (completedTasksCount /
            totalTasksCount) *
            100
        )
      : 0;


  // ----------------------------------------------------------
  // CRIAR PROJETO
  // ----------------------------------------------------------

  const handleCreate = () => {

    if (!title.trim()) {

      Alert.alert(
        'Atenção',
        'Informe o nome do projeto.'
      );

      return;
    }


    addProject(
      title.trim(),
      description.trim(),
      dueDate.trim()
    );


    setTitle('');
    setDescription('');
    setDueDate('');

    setModalVisible(false);
  };


  return (
    <View style={styles.container}>

      <ScrollView
        contentContainerStyle={
          styles.scrollPadding
        }
      >

        {/* ==================================================
            DESEMPENHO
        ================================================== */}

        <View style={styles.metricsCard}>

          <Text style={styles.metricsTitle}>
            Desempenho Geral
          </Text>


          <View
            style={
              styles.progressBarBackground
            }
          >

            <View
              style={[
                styles.progressBarFill,
                {
                  width:
                    `${progressPercentage}%`,
                },
              ]}
            />

          </View>


          <Text style={styles.progressText}>
            {progressPercentage}% das tarefas
            concluídas ({completedTasksCount}/
            {totalTasksCount})
          </Text>


          <View style={styles.metricsGrid}>

            <View style={styles.metricItem}>

              <Text
                style={styles.metricValue}
              >
                {allTasks.length}
              </Text>

              <Text
                style={styles.metricLabel}
              >
                Total Ativas
              </Text>

            </View>


            <View style={styles.metricItem}>

              <Text
                style={styles.metricValue}
              >
                {activeProjects.length}
              </Text>

              <Text
                style={styles.metricLabel}
              >
                Projetos
              </Text>

            </View>

          </View>

        </View>


        {/* ==================================================
            CABEÇALHO
        ================================================== */}

        <View
          style={
            styles.sectionHeaderRow
          }
        >

          <Text
            style={
              styles.sectionMainTitle
            }
          >
            Projetos Ativos
          </Text>


          <TouchableOpacity
            onPress={() =>
              navigation.navigate(
                'History'
              )
            }
          >

            <Text
              style={
                styles.historyLinkText
              }
            >
              Ver Histórico ›
            </Text>

          </TouchableOpacity>

        </View>


        {/* ==================================================
            PROJETOS
        ================================================== */}

        {activeProjects.map(
          (item) => (

            <TouchableOpacity
              key={item.id}

              style={styles.card}

              onPress={() =>
                navigation.navigate(
                  'ProjectDetails',
                  {
                    projectId:
                      item.id,
                  }
                )
              }

              activeOpacity={0.8}
            >

              <View
                style={styles.cardHeader}
              >

                <Text
                  style={styles.cardTitle}
                >
                  {item.title}
                </Text>


                <View
                  style={
                    styles.softBadge
                  }
                >

                  <Text
                    style={
                      styles.softBadgeText
                   
