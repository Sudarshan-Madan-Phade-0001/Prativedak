import { StyleSheet, ScrollView, View, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useSensors } from '@/hooks/useSensors';
import { useLocation } from '@/hooks/useLocation';
import { useTheme } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function HomeScreen() {
  const { logout, user } = useAuth();
  const { isMonitoring, accidentDetected } = useSensors();
  const { isTracking, location } = useLocation();
  const { theme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      router.replace('/login');
    }
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="shield-checkmark" size={60} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>Prativedak</Text>
        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Welcome{user ? `, ${user.name}` : ''}!</Text>
        <Text style={[styles.description, { color: theme.textSecondary }]}>
          Smart accident detection and emergency response system for vehicle safety
        </Text>
      </View>

      {accidentDetected && (
        <Card style={[styles.alertCard, { borderColor: theme.error }]}>
          <View style={styles.alertContent}>
            <Ionicons name="warning" size={24} color={theme.error} />
            <Text style={[styles.alertText, { color: theme.error }]}>ACCIDENT DETECTED!</Text>
          </View>
        </Card>
      )}

      <View style={styles.statusGrid}>
        <Card style={styles.statusCard}>
          <Ionicons name="location" size={24} color={isTracking ? theme.success : theme.textSecondary} />
          <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>GPS Tracking</Text>
          <Text style={[styles.statusValue, { color: theme.text }]}>{isTracking ? 'Active' : 'Inactive'}</Text>
        </Card>
        
        <Card style={styles.statusCard}>
          <Ionicons name="speedometer" size={24} color={isMonitoring ? theme.success : theme.textSecondary} />
          <Text style={[styles.statusLabel, { color: theme.textSecondary }]}>Sensor Monitor</Text>
          <Text style={[styles.statusValue, { color: theme.text }]}>{isMonitoring ? 'Active' : 'Inactive'}</Text>
        </Card>
      </View>

      {location && (
        <Card style={styles.locationCard}>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Current Location</Text>
          <Text style={[styles.locationText, { color: theme.textSecondary }]}>Lat: {location.latitude.toFixed(6)}</Text>
          <Text style={[styles.locationText, { color: theme.textSecondary }]}>Lng: {location.longitude.toFixed(6)}</Text>
        </Card>
      )}

      <Card style={styles.infoCard}>
        <Text style={[styles.infoTitle, { color: theme.text }]}>How It Works</Text>
        <View style={styles.infoItem}>
          <Ionicons name="location" size={16} color={theme.primary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>Real-time GPS tracking monitors your location</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="speedometer" size={16} color={theme.secondary} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>Sensors detect sudden impacts and accidents</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="call" size={16} color={theme.error} />
          <Text style={[styles.infoText, { color: theme.textSecondary }]}>Auto-calls emergency contacts when needed</Text>
        </View>
      </Card>

      <View style={styles.buttonContainer}>
        <Button
          title="Monitor Dashboard"
          onPress={() => router.push('/(tabs)/monitor')}
          variant="primary"
          icon="speedometer"
          style={styles.actionButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
    paddingTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 16,
    marginTop: 8,
  },
  alertCard: {
    marginBottom: 20,
    borderWidth: 2,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertText: {
    fontWeight: 'bold',
    marginLeft: 12,
    fontSize: 16,
  },
  statusGrid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 20,
  },
  statusCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
  },
  statusLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  statusValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
  },
  locationCard: {
    marginBottom: 20,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 14,
    fontFamily: 'monospace',
    marginBottom: 4,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  actionButton: {
    width: '100%',
  },
  description: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});