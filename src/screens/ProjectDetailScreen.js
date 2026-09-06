import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useProjectStore } from '../store/useProjectStore';

export default function ProjectDetailsScreen({ route, navigation }) {
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
      <Text style={styles.description}>{project.description || 'Sem descrição informada.'}</Text>

      <TouchableOpacity style={styles.btnDelete} onPress={handleDelete}>
        <Text style={styles.btnDeleteText}>Excluir Projeto</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#121212', padding: 20 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  status: { color: '#007AFF', fontSize: 16, marginBottom: 16 },
  description: { color: '#ccc', fontSize: 16, lineHeight: 22 },
  btnDelete: { marginTop: 40, backgroundColor: '#FF3B30', padding: 14, borderRadius: 8, alignItems: 'center' },
  btnDeleteText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
