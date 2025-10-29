export const lightTheme = {
  primary: '#007AFF',
  secondary: '#28a745',
  accent: '#FF6B35',
  background: '#F8F9FA',
  surface: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#666666',
  border: '#E0E0E0',
  error: '#DC3545',
  warning: '#FFC107',
  success: '#28A745',
  info: '#17A2B8',
  shadow: 'rgba(0, 0, 0, 0.1)',
};

export const darkTheme = {
  primary: '#0A84FF',
  secondary: '#32D74B',
  accent: '#FF9F0A',
  background: '#000000',
  surface: '#1C1C1E',
  text: '#FFFFFF',
  textSecondary: '#8E8E93',
  border: '#38383A',
  error: '#FF453A',
  warning: '#FFD60A',
  success: '#32D74B',
  info: '#64D2FF',
  shadow: 'rgba(255, 255, 255, 0.1)',
};

export type Theme = typeof lightTheme;