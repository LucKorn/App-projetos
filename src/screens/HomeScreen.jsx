
import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useProjectStore } from '../store/useProjectStore';

export default function HomeScreen() {
  const projects = useProjectStore((state) => state.projects);
  const tasks = useProjectStore((state) => state.tasks);

  const renderProjectCard = ({ item }) => {
    const projectTasks = tasks.filter((t) => t.projectId === item.id);
    const completedTasks = projectTasks.filter(
      (t) => t.status === 'Concluído'
    ).length;
    const totalTasks = projectTasks.length;
    const progress =
      totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return (
      <TouchableOpacity style={styles.card} activeOpacity={0.8}>
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.badge,
              { backgroundColor: (item.color || '#6200EE') + '20' },
            ]}
          >
            <Text style={[styles.badgeText, { color: item.color || '#6200EE' }]}>
              {item.category || 'Geral'}
            </Text>
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        <Text style={styles.projectTitle}>{item.name}</Text>

        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${progress}%`,
                backgroundColor: item.color || '#6200EE',
              },
            ]}
          />
        </View>

        <Text style={styles.taskCount}>
          {completedTasks} de {totalTasks} tarefas concluídas
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.header}>
        <Text style={styles.greeting}>Meus Projetos</Text>
        <Text style={styles.subGreeting}>Acompanhamento diário</Text>
      </View>

      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectCard}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <TouchableOpacity style={styles.fab} activeOpacity={0.8}>
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F6F8' },
  header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 10 },
  greeting: { fontSize: 26, fontWeight: 'bold', color: '#1A1A1A' },
  subGreeting: { fontSize: 14, color: '#7C7C7C', marginTop: 4 },
  listContainer: { padding: 20 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  progressText: { fontSize: 14, fontWeight: 'bold', color: '#555' },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#EAEAEA',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressBarFill: { height: '100%', borderRadius: 4 },
  taskCount: { fontSize: 12, color: '#888' },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#6200EE',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  fabIcon: { fontSize: 28, color: '#FFF', marginTop: -2 },
});
