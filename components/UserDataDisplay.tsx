import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function UserDataDisplay() {
  const { user } = useAuth();
  const { theme } = useTheme();

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.error + '20' }]}>
        <Text style={[styles.text, { color: theme.error }]}>No user data found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.success + '20' }]}>
      <Text style={[styles.title, { color: theme.success }]}>Current User Data:</Text>
      <Text style={[styles.text, { color: theme.text }]}>ID: {user.id}</Text>
      <Text style={[styles.text, { color: theme.text }]}>Email: {user.email}</Text>
      <Text style={[styles.text, { color: theme.text }]}>Name: {user.name || 'Not set'}</Text>
      <Text style={[styles.text, { color: theme.text }]}>Phone: {user.phone || 'Not set'}</Text>
      <Text style={[styles.text, { color: theme.text }]}>Vehicle: {user.vehicleNumber || 'Not set'}</Text>
      <Text style={[styles.text, { color: theme.text }]}>
        Emergency Contacts: {user.emergencyContacts?.length || 0}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderRadius: 8,
    margin: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  text: {
    fontSize: 14,
    marginBottom: 4,
  },
});