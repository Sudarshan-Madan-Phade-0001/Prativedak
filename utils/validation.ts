export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string) => {
  return {
    minLength: password.length >= 5,
  };
};

export const isPasswordValid = (password: string): boolean => {
  return password.length >= 5;
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\D/g, ''));
};

export const validateVehicleNumber = (vehicleNumber: string): boolean => {
  const vehicleRegex = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,2}[0-9]{4}$/;
  return vehicleRegex.test(vehicleNumber.replace(/\s/g, '').toUpperCase());
};

export const getPasswordStrength = (password: string): 'weak' | 'medium' | 'strong' => {
  const validation = validatePassword(password);
  const score = Object.values(validation).filter(Boolean).length;
  
  if (score < 3) return 'weak';
  if (score < 5) return 'medium';
  return 'strong';
};