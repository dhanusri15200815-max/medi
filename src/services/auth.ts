import { UserProfile } from '../types';

const USERS_STORAGE_KEY = 'medclarity_users';
const CURRENT_USER_KEY = 'medclarity_current_user';

// Pre-seed a default demonstration patient if no users exist
const DEFAULT_DEMO_USER: UserProfile = {
  id: 'user-demo-1',
  fullName: 'Priya Sharma',
  email: 'priya.sharma@example.com',
  password: 'Password123!',
  age: 46,
  gender: 'Female',
  phone: '+91 98765 43210',
  allergies: 'Penicillin (mild rash)',
  bloodGroup: 'B Positive',
  emergencyContact: 'Rajesh Sharma (+91 98765 43211)',
  createdAt: '2026-09-01T10:00:00.000Z',
};

export function getAllUsers(): UserProfile[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    if (!raw) {
      const initial = [DEFAULT_DEMO_USER];
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch {
    return [DEFAULT_DEMO_USER];
  }
}

export function getCurrentUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
    // Default to demo user for smooth immediate experience, but still allow explicit login/logout
    return DEFAULT_DEMO_USER;
  } catch {
    return DEFAULT_DEMO_USER;
  }
}

export function setCurrentUser(user: UserProfile | null): void {
  if (user) {
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(CURRENT_USER_KEY);
  }
}

export function registerUser(newUserData: Omit<UserProfile, 'id' | 'createdAt'>): UserProfile {
  const users = getAllUsers();
  const existing = users.find(u => u.email.toLowerCase() === newUserData.email.toLowerCase());
  if (existing) {
    throw new Error('An account with this email address already exists. Please login instead.');
  }

  const newUser: UserProfile = {
    ...newUserData,
    id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    createdAt: new Date().toISOString(),
  };

  users.push(newUser);
  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  setCurrentUser(newUser);
  return newUser;
}

export function loginUser(email: string, password: string):UserProfile {
  const users = getAllUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
  
  if (!user) {
    throw new Error('No account found with this email address. Please check your spelling or sign up.');
  }
  
  if (user.password && user.password !== password) {
    throw new Error('Incorrect password entered. Please try again.');
  }

  setCurrentUser(user);
  return user;
}

export function updateUserProfile(updated: Partial<UserProfile>): UserProfile {
  const current = getCurrentUser();
  if (!current) {
    throw new Error('No user is currently logged in.');
  }

  const users = getAllUsers();
  const index = users.findIndex(u => u.id === current.id);
  const modifiedUser: UserProfile = {
    ...current,
    ...updated,
  };

  if (index !== -1) {
    users[index] = modifiedUser;
  } else {
    users.push(modifiedUser);
  }

  localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  setCurrentUser(modifiedUser);
  return modifiedUser;
}

export function logoutUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}
