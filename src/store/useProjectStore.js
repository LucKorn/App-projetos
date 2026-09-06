import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const useProjectStore = create(
  persist(
    (set) => ({
      projects: [
        { id: '1', title: 'App Projetos', description: 'Pipeline de CI/CD configurado com sucesso.', status: 'Concluído' },
        { id: '2', title: 'Novo Projeto', description: 'Definir escopo e telas principais.', status: 'Em Andamento' }
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
    }),
    {
      name: 'projects-storage',
      storage: createJSONStorage(() => AsyncStorage)
    }
  )
);

