/**
 * AUTH SERVICE — Autenticación, registro, sesiones y perfil
 */
import { StorageService } from './storageService.js';

const USERS_KEY = 'users';
const SESSION_KEY = 'session';

// Inicializar usuario demo si no existe
function initDemoUsers() {
  const users = StorageService.get(USERS_KEY, []);
  if (users.length === 0) {
    const demoUser = {
      id: 'usr_demo_1',
      firstName: 'Carolina',
      lastName: 'Felipe',
      email: 'carolina@adminya.com.ar',
      phone: '11 3033-2341',
      passwordHash: btoa('demo123'), // Codificación básica de demo (en backend real se usa bcrypt/argon2)
      createdAt: new Date().toISOString()
    };
    StorageService.set(USERS_KEY, [demoUser]);
  }
}

initDemoUsers();

const listeners = new Set();

export const AuthService = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  notify() {
    const user = this.getCurrentUser();
    listeners.forEach(fn => fn(user));
  },

  getCurrentUser() {
    return StorageService.get(SESSION_KEY, null);
  },

  isAuthenticated() {
    return !!this.getCurrentUser();
  },

  register({ firstName, lastName, email, phone, password, confirmPassword }) {
    if (!firstName || !lastName || !email || !phone || !password) {
      throw new Error('Todos los campos son obligatorios.');
    }
    const emailNorm = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailNorm)) {
      throw new Error('Ingresá un correo electrónico válido.');
    }
    if (password.length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres.');
    }
    if (password !== confirmPassword) {
      throw new Error('Las contraseñas no coinciden.');
    }

    const users = StorageService.get(USERS_KEY, []);
    const existing = users.find(u => u.email === emailNorm);
    if (existing) {
      throw new Error('El correo electrónico ya se encuentra registrado. Iniciá sesión.');
    }

    const newUser = {
      id: 'usr_' + Date.now(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: emailNorm,
      phone: phone.trim(),
      passwordHash: btoa(password),
      createdAt: new Date().toISOString()
    };

    users.push(newUser);
    StorageService.set(USERS_KEY, users);

    // Auto-login con el nuevo usuario (sin el hash)
    const sessionUser = { ...newUser };
    delete sessionUser.passwordHash;
    StorageService.set(SESSION_KEY, sessionUser);
    this.notify();

    return sessionUser;
  },

  login({ email, password, rememberMe = true }) {
    if (!email || !password) {
      throw new Error('Completá tu correo y contraseña.');
    }
    const emailNorm = email.trim().toLowerCase();
    const users = StorageService.get(USERS_KEY, []);
    const user = users.find(u => u.email === emailNorm);

    if (!user || user.passwordHash !== btoa(password)) {
      throw new Error('Correo o contraseña incorrectos. Si sos nuevo, registrate gratis.');
    }

    const sessionUser = { ...user };
    delete sessionUser.passwordHash;
    StorageService.set(SESSION_KEY, sessionUser);
    this.notify();

    return sessionUser;
  },

  logout() {
    StorageService.remove(SESSION_KEY);
    this.notify();
  },

  updateProfile(updateData) {
    const sessionUser = this.getCurrentUser();
    if (!sessionUser) throw new Error('No hay sesión iniciada.');

    const users = StorageService.get(USERS_KEY, []);
    const index = users.findIndex(u => u.id === sessionUser.id);
    if (index === -1) throw new Error('Usuario no encontrado.');

    if (updateData.firstName) users[index].firstName = updateData.firstName.trim();
    if (updateData.lastName) users[index].lastName = updateData.lastName.trim();
    if (updateData.phone) users[index].phone = updateData.phone.trim();

    if (updateData.newPassword) {
      if (updateData.newPassword.length < 6) {
        throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
      }
      users[index].passwordHash = btoa(updateData.newPassword);
    }

    StorageService.set(USERS_KEY, users);

    const updatedSession = { ...users[index] };
    delete updatedSession.passwordHash;
    StorageService.set(SESSION_KEY, updatedSession);
    this.notify();

    return updatedSession;
  },

  recoverPassword(email) {
    const emailNorm = email.trim().toLowerCase();
    const users = StorageService.get(USERS_KEY, []);
    const user = users.find(u => u.email === emailNorm);
    if (!user) {
      throw new Error('No encontramos una cuenta con ese correo electrónico.');
    }
    // Simulación de envío de correo de recuperación
    return {
      success: true,
      message: `Enviamos un enlace de recuperación a ${emailNorm}. Revisá tu bandeja de entrada o spam.`
    };
  }
};
