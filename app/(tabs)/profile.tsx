import React, { useState } from 'react';
import { ScrollView, View, Text, TextInput, StyleSheet, Alert, TouchableOpacity, Switch, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { validatePhone, validateVehicleNumber } from '@/utils/validation';

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { user, logout, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [vehicleNumber, setVehicleNumber] = useState(user?.vehicleNumber || '');
  const [emergencyContact1, setEmergencyContact1] = useState({
    name: user?.emergencyContacts?.[0]?.name || '',
    phone: user?.emergencyContacts?.[0]?.phone || '',
    relationship: user?.emergencyContacts?.[0]?.relationship || '',
    priority: 1
  });
  const [emergencyContact2, setEmergencyContact2] = useState({
    name: user?.emergencyContacts?.[1]?.name || '',
    phone: user?.emergencyContacts?.[1]?.phone || '',
    relationship: user?.emergencyContacts?.[1]?.relationship || '',
    priority: 2
  });

  const handleSave = async () => {
    if (!validatePhone(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!validateVehicleNumber(vehicleNumber)) {
      Alert.alert('Invalid Vehicle Number', 'Please enter a valid vehicle number');
      return;
    }

    const emergencyContacts = [];
    if (emergencyContact1.name && emergencyContact1.phone) {
      emergencyContacts.push(emergencyContact1);
    }
    if (emergencyContact2.name && emergencyContact2.phone) {
      emergencyContacts.push(emergencyContact2);
    }

    const result = await updateProfile({
      name,
      phone,
      vehicleNumber,
      emergencyContacts
    });

    if (result.success) {
      Alert.alert('Success', 'Profile updated successfully!');
      setIsEditing(false);
    } else {
      Alert.alert('Error', result.message);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: () => logout() }
      ]
    );
  };

  const tabs = [
    { id: 'profile', title: 'Profile', icon: 'person' },
    { id: 'settings', title: 'Settings', icon: 'settings' },
    { id: 'help', title: 'Help', icon: 'help-circle' },
  ];

  const settingsOptions = [
    { id: 1, title: 'Notifications', icon: 'notifications', type: 'toggle', value: true },
    { id: 2, title: 'Location Services', icon: 'location', type: 'toggle', value: true },
    { id: 3, title: 'Emergency Contacts', icon: 'people', type: 'navigation' },
    { id: 4, title: 'Sensor Sensitivity', icon: 'speedometer', type: 'navigation' },
  ];

  const helpOptions = [
    { title: 'Email Support', icon: 'mail', action: () => Linking.openURL('mailto:support@prativedak.com') },
    { title: 'Call Support', icon: 'call', action: () => Linking.openURL('tel:+911234567890') },
    { title: 'FAQ', icon: 'help-circle', action: () => {} },
    { title: 'Privacy Policy', icon: 'shield-checkmark', action: () => {} },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <Ionicons name="person" size={32} color={theme.primary} />
        <Text style={[styles.title, { color: theme.text }]}>Profile</Text>
      </View>

      <Card style={styles.tabsCard}>
        <View style={styles.tabsContainer}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                { 
                  backgroundColor: activeTab === tab.id ? theme.primary : 'transparent',
                }
              ]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Ionicons 
                name={tab.icon as any} 
                size={18} 
                color={activeTab === tab.id ? '#fff' : theme.textSecondary} 
              />
              <Text style={[
                styles.tabText,
                { 
                  color: activeTab === tab.id ? '#fff' : theme.textSecondary,
                }
              ]}>
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Card>

      {activeTab === 'profile' && (
      <Card style={styles.profileCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color={theme.primary} />
          <Button
            title={isEditing ? "Cancel" : "Edit Profile"}
            onPress={() => setIsEditing(!isEditing)}
            variant={isEditing ? "secondary" : "primary"}
            size="small"
            icon={isEditing ? "close" : "pencil"}
          />
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Name</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isEditing ? theme.background : theme.border + '50',
                  color: theme.text,
                  borderColor: theme.border
                }
              ]}
              value={name}
              onChangeText={setName}
              editable={isEditing}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: theme.border + '50',
                  color: theme.textSecondary,
                  borderColor: theme.border
                }
              ]}
              value={user?.email}
              editable={false}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isEditing ? theme.background : theme.border + '50',
                  color: theme.text,
                  borderColor: theme.border
                }
              ]}
              value={phone}
              onChangeText={setPhone}
              editable={isEditing}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={[styles.label, { color: theme.text }]}>Vehicle Number</Text>
            <TextInput
              style={[
                styles.input,
                { 
                  backgroundColor: isEditing ? theme.background : theme.border + '50',
                  color: theme.text,
                  borderColor: theme.border
                }
              ]}
              value={vehicleNumber}
              onChangeText={setVehicleNumber}
              editable={isEditing}
              autoCapitalize="characters"
            />
          </View>

          <Text style={[styles.sectionTitle, { color: theme.text }]}>Emergency Contacts</Text>
          
          <View style={styles.emergencySection}>
            <Text style={[styles.priorityLabel, { color: theme.primary }]}>Priority 1 (Primary)</Text>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isEditing ? theme.background : theme.border + '50',
                    color: theme.text,
                    borderColor: theme.border
                  }
                ]}
                value={emergencyContact1.name}
                onChangeText={(text) => setEmergencyContact1({...emergencyContact1, name: text})}
                editable={isEditing}
                placeholder="Contact Name"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isEditing ? theme.background : theme.border + '50',
                    color: theme.text,
                    borderColor: theme.border
                  }
                ]}
                value={emergencyContact1.phone}
                onChangeText={(text) => setEmergencyContact1({...emergencyContact1, phone: text})}
                editable={isEditing}
                keyboardType="phone-pad"
                placeholder="Phone Number"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Relationship</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isEditing ? theme.background : theme.border + '50',
                    color: theme.text,
                    borderColor: theme.border
                  }
                ]}
                value={emergencyContact1.relationship}
                onChangeText={(text) => setEmergencyContact1({...emergencyContact1, relationship: text})}
                editable={isEditing}
                placeholder="e.g., Father, Mother, Spouse"
              />
            </View>
          </View>

          <View style={styles.emergencySection}>
            <Text style={[styles.priorityLabel, { color: theme.secondary }]}>Priority 2 (Secondary)</Text>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Name</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isEditing ? theme.background : theme.border + '50',
                    color: theme.text,
                    borderColor: theme.border
                  }
                ]}
                value={emergencyContact2.name}
                onChangeText={(text) => setEmergencyContact2({...emergencyContact2, name: text})}
                editable={isEditing}
                placeholder="Contact Name"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isEditing ? theme.background : theme.border + '50',
                    color: theme.text,
                    borderColor: theme.border
                  }
                ]}
                value={emergencyContact2.phone}
                onChangeText={(text) => setEmergencyContact2({...emergencyContact2, phone: text})}
                editable={isEditing}
                keyboardType="phone-pad"
                placeholder="Phone Number"
              />
            </View>
            <View style={styles.inputContainer}>
              <Text style={[styles.label, { color: theme.text }]}>Relationship</Text>
              <TextInput
                style={[
                  styles.input,
                  { 
                    backgroundColor: isEditing ? theme.background : theme.border + '50',
                    color: theme.text,
                    borderColor: theme.border
                  }
                ]}
                value={emergencyContact2.relationship}
                onChangeText={(text) => setEmergencyContact2({...emergencyContact2, relationship: text})}
                editable={isEditing}
                placeholder="e.g., Brother, Sister, Friend"
              />
            </View>
          </View>

          <Card style={[styles.defaultContactsCard, { backgroundColor: theme.info + '20' }]}>
            <Text style={[styles.defaultTitle, { color: theme.info }]}>Default Emergency Numbers</Text>
            <Text style={[styles.defaultText, { color: theme.text }]}>• 112 - Emergency Services</Text>
            <Text style={[styles.defaultText, { color: theme.text }]}>• 108 - Ambulance</Text>
            <Text style={[styles.defaultText, { color: theme.text }]}>• 100 - Police</Text>
          </Card>

          {isEditing && (
            <Button
              title="Save Changes"
              onPress={handleSave}
              variant="success"
              icon="checkmark"
              style={styles.saveButton}
            />
          )}
        </View>
      </Card>
      )}

      {activeTab === 'settings' && (
        <View>
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="moon" size={24} color={theme.primary} />
                <Text style={[styles.settingTitle, { color: theme.text }]}>Dark Mode</Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: theme.border, true: theme.primary }}
                thumbColor={isDark ? '#fff' : '#f4f3f4'}
              />
            </View>
          </Card>

          {settingsOptions.map((option) => (
            <Card key={option.id} style={styles.settingCard}>
              <TouchableOpacity style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name={option.icon as any} size={24} color={theme.primary} />
                  <Text style={[styles.settingTitle, { color: theme.text }]}>
                    {option.title}
                  </Text>
                </View>
                {option.type === 'toggle' ? (
                  <Switch
                    value={option.value}
                    trackColor={{ false: theme.border, true: theme.primary }}
                    thumbColor={option.value ? '#fff' : '#f4f3f4'}
                  />
                ) : (
                  <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
                )}
              </TouchableOpacity>
            </Card>
          ))}
        </View>
      )}

      {activeTab === 'help' && (
        <View>
          <Card style={styles.helpCard}>
            <Text style={[styles.helpTitle, { color: theme.text }]}>Getting Started</Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>• How to set up your profile</Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>• Enabling location services</Text>
            <Text style={[styles.helpText, { color: theme.textSecondary }]}>• Understanding sensor monitoring</Text>
          </Card>

          <Card style={styles.helpCard}>
            <Text style={[styles.helpTitle, { color: theme.text }]}>Contact Support</Text>
            {helpOptions.map((option, index) => (
              <TouchableOpacity key={index} style={styles.helpOption} onPress={option.action}>
                <Ionicons name={option.icon as any} size={24} color={theme.primary} />
                <Text style={[styles.helpOptionText, { color: theme.text }]}>
                  {option.title}
                </Text>
                <Ionicons name="chevron-forward" size={20} color={theme.textSecondary} />
              </TouchableOpacity>
            ))}
          </Card>
        </View>
      )}

      <Button
        title="Logout"
        onPress={handleLogout}
        variant="danger"
        icon="log-out"
        style={styles.logoutButton}
      />
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
    marginBottom: 24,
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  profileCard: {
    marginBottom: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 16,
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  saveButton: {
    marginTop: 20,
  },
  logoutButton: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 16,
  },
  emergencySection: {
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  priorityLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  defaultContactsCard: {
    marginTop: 16,
  },
  defaultTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  defaultText: {
    fontSize: 14,
    marginBottom: 4,
  },
  tabsCard: {
    marginBottom: 16,
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabText: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingCard: {
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 16,
  },
  helpCard: {
    marginBottom: 16,
  },
  helpTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  helpText: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  helpOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  helpOptionText: {
    fontSize: 16,
    marginLeft: 16,
    flex: 1,
  },
});