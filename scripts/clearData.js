// Simple script to clear AsyncStorage data for testing
// Run this in the app console or as a standalone script

const clearAsyncStorage = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.clear();
    console.log('AsyncStorage cleared successfully');
  } catch (error) {
    console.error('Error clearing AsyncStorage:', error);
  }
};

// Export for use in app
module.exports = { clearAsyncStorage };