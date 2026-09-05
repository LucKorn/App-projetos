import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useProjectStore = create(
  persist(
    (set) => ({
      projects: [
        {
          id: '1',
          name: 'Projeto Demonstrativo',
          category: 'Geral',
          color: '#6200EE',
        },
      ],
      tasks: [],
      notes: [],

      // Ações de Projetos
      addProject: (project) =>
        set((state) => ({
          projects: [...state.projects, { ...project, id: Date.now().toString() }],
        })),

      deleteProject: (id) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== id),
          tasks: state.tasks.filter((t) => t.projectId !== id),
          notes: state.notes.filter((n) => n.projectId !== id),
        })),

      // Ações de Tarefas
      addTask: (task) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            { ...task, id: Date.now().toString(), status: 'A Fazer' },
          ],
        })),

      toggleTaskStatus: (taskId) =>
        set((state) => ({
          tasks: state.tasks.map((task) => {
            if (task.id === taskId) {
              const nextStatus =
                task.status === 'A Fazer'
                  ? 'Em Andamento'
                  : task.status === 'Em Andamento'
                  ? 'Concluído'
                  : 'A Fazer';
              return { ...task, status: nextStatus };
            }
            return task;
          }),
        })),

      // Ações de Anotações
      addNote: (note) =>
        set((state) => ({
          notes: [...state.notes, { ...note, id: Date.now().toString(), updatedAt: new Date().toISOString() }],
        })),
    }),
    {
      name: 'app-projects-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
