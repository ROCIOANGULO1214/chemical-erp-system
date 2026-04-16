import {
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  getIdToken,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile as firebaseUpdateProfile,
  confirmPasswordReset,
  applyActionCode
} from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db } from '../firebase';

const parseAuthError = (error) => {
  const code = error?.code || error?.message;
  switch (code) {
    case 'auth/invalid-email':
      return 'El correo electrónico no es válido.';
    case 'auth/user-disabled':
      return 'El usuario ha sido deshabilitado.';
    case 'auth/user-not-found':
      return 'No existe una cuenta con ese correo o usuario.';
    case 'auth/wrong-password':
      return 'Contraseña incorrecta.';
    case 'auth/email-already-in-use':
      return 'El correo ya está en uso.';
    case 'auth/weak-password':
      return 'La contraseña es demasiado débil.';
    case 'auth/operation-not-allowed':
      return 'Operación de autenticación no permitida.';
    case 'auth/requires-recent-login':
      return 'Debes volver a iniciar sesión para esta acción.';
    case 'auth/invalid-action-code':
      return 'El código proporcionado no es válido o ha expirado.';
    default:
      return typeof error === 'string'
        ? error
        : error?.message || 'Error de autenticación.';
  }
};

const getPermissionsForRole = (role) => {
  switch (role) {
    case 'admin':
      return ['admin', 'quality', 'production', 'inventory', 'customers', 'reports'];
    case 'quality':
      return ['quality'];
    case 'lab_technician':
      return ['quality', 'inventory'];
    case 'production':
      return ['production'];
    case 'supervisor':
      return ['production', 'quality'];
    default:
      return ['operator'];
  }
};

const buildUserProfile = async (firebaseUser) => {
  if (!firebaseUser) return null;

  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnapshot = await getDoc(userRef);
  const profileData = userSnapshot.exists() ? userSnapshot.data() : {};

  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || profileData.email || '',
    username: profileData.username || '',
    first_name: profileData.first_name || '',
    last_name: profileData.last_name || '',
    role: profileData.role || 'operator',
    permissions: profileData.permissions || getPermissionsForRole(profileData.role || 'operator'),
    isActive: profileData.isActive !== false,
    createdAt: profileData.createdAt || '',
    updatedAt: profileData.updatedAt || '',
    lastLogin: profileData.lastLogin || '',
    emailVerified: firebaseUser.emailVerified,
    displayName: firebaseUser.displayName || `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim()
  };
};

const authService = {
  setAuthToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  },

  onAuthStateChanged: (callback) => {
    return onAuthStateChanged(auth, callback);
  },

  login: async (credentials) => {
    try {
      const { username, email, password } = credentials || {};

      if (!password) {
        throw new Error('La contraseña es requerida.');
      }

      let loginEmail = email;

      if (!loginEmail && username) {
        const usernameQuery = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
        const usernameSnapshot = await getDocs(usernameQuery);
        if (usernameSnapshot.empty) {
          throw new Error('Usuario no encontrado.');
        }
        loginEmail = usernameSnapshot.docs[0].data().email;
      }

      if (!loginEmail) {
        throw new Error('El correo o usuario es requerido.');
      }

      const userCredential = await signInWithEmailAndPassword(auth, loginEmail, password);
      const token = await getIdToken(userCredential.user);
      authService.setAuthToken(token);

      const user = await authService.getCurrentUser();
      return { user, token };
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  register: async (userData) => {
    try {
      const { email, password, username, first_name = '', last_name = '', role = 'operator' } = userData || {};

      if (!email || !password || !username) {
        throw new Error('Email, nombre de usuario y contraseña son requeridos.');
      }

      const usernameQuery = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
      const usernameSnapshot = await getDocs(usernameQuery);
      if (!usernameSnapshot.empty) {
        throw new Error('El nombre de usuario ya está en uso.');
      }

      const methods = await fetchSignInMethodsForEmail(auth, email);
      if (methods.length > 0) {
        throw new Error('El correo ya está registrado.');
      }

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const userRef = doc(db, 'users', userCredential.user.uid);
      const userProfile = {
        username: username.toLowerCase(),
        email,
        first_name,
        last_name,
        role,
        permissions: getPermissionsForRole(role),
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      await setDoc(userRef, userProfile);
      await sendEmailVerification(userCredential.user);
      const token = await getIdToken(userCredential.user);
      authService.setAuthToken(token);

      return { user: { id: userCredential.user.uid, ...userProfile, emailVerified: userCredential.user.emailVerified }, token };
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  logout: async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw new Error('No se pudo cerrar sesión.');
    } finally {
      authService.setAuthToken(null);
    }
  },

  getCurrentUser: async () => {
    try {
      const build = async (firebaseUser) => {
        const user = await buildUserProfile(firebaseUser);
        if (!user) {
          throw new Error('No hay sesión activa.');
        }
        return user;
      };

      if (auth.currentUser) {
        return await build(auth.currentUser);
      }

      return new Promise((resolve, reject) => {
        const unsubscribe = onAuthStateChanged(
          auth,
          async (firebaseUser) => {
            unsubscribe();
            if (!firebaseUser) {
              return reject(new Error('No hay sesión activa.'));
            }
            try {
              const user = await build(firebaseUser);
              resolve(user);
            } catch (err) {
              reject(err);
            }
          },
          (error) => {
            unsubscribe();
            reject(error);
          }
        );
      });
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  updateProfile: async (userData) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado.');
      }

      const profileUpdates = {};
      const firestoreUpdates = {};

      if (userData.displayName) {
        profileUpdates.displayName = userData.displayName;
      }

      if (userData.photoURL) {
        profileUpdates.photoURL = userData.photoURL;
      }

      if (Object.keys(profileUpdates).length > 0) {
        await firebaseUpdateProfile(auth.currentUser, profileUpdates);
      }

      if (userData.first_name) firestoreUpdates.first_name = userData.first_name;
      if (userData.last_name) firestoreUpdates.last_name = userData.last_name;
      if (userData.role) firestoreUpdates.role = userData.role;
      if (userData.permissions) firestoreUpdates.permissions = userData.permissions;
      if (userData.preferences) firestoreUpdates.preferences = userData.preferences;

      if (Object.keys(firestoreUpdates).length > 0) {
        firestoreUpdates.updatedAt = new Date().toISOString();
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, firestoreUpdates);
      }

      return await authService.getCurrentUser();
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  changePassword: async (passwordData) => {
    try {
      const { currentPassword, newPassword } = passwordData || {};
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado.');
      }
      if (!currentPassword || !newPassword) {
        throw new Error('Contraseña actual y nueva son requeridas.');
      }

      await signInWithEmailAndPassword(auth, auth.currentUser.email, currentPassword);
      await updatePassword(auth.currentUser, newPassword);
      return { success: true };
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  forgotPassword: async (email) => {
    try {
      if (!email) {
        throw new Error('El correo es requerido.');
      }
      await sendPasswordResetEmail(auth, email);
      return { success: true, message: 'Se envió un correo para restablecer la contraseña.' };
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      if (!token || !newPassword) {
        throw new Error('Token y nueva contraseña son requeridos.');
      }
      await confirmPasswordReset(auth, token, newPassword);
      return { success: true };
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  refreshToken: async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado.');
      }
      const token = await getIdToken(auth.currentUser, true);
      authService.setAuthToken(token);
      return token;
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  verifyEmail: async (token) => {
    try {
      if (!token) {
        throw new Error('Token de verificación es requerido.');
      }
      await applyActionCode(auth, token);
      if (auth.currentUser) {
        await auth.currentUser.reload();
      }
      return { success: true };
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  resendVerification: async () => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado.');
      }
      await sendEmailVerification(auth.currentUser);
      return { success: true };
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  checkUsernameAvailability: async (username) => {
    try {
      if (!username) {
        throw new Error('El nombre de usuario es requerido.');
      }
      const usernameQuery = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
      const snapshot = await getDocs(usernameQuery);
      return { available: snapshot.empty };
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  checkEmailAvailability: async (email) => {
    try {
      if (!email) {
        throw new Error('El correo es requerido.');
      }
      const methods = await fetchSignInMethodsForEmail(auth, email);
      return { available: methods.length === 0 };
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return { available: true };
      }
      throw new Error(parseAuthError(error));
    }
  },

  getUserPermissions: async () => {
    try {
      const user = await authService.getCurrentUser();
      return user.permissions || [];
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  updatePreferences: async (preferences) => {
    try {
      if (!auth.currentUser) {
        throw new Error('Usuario no autenticado.');
      }
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        preferences,
        updatedAt: new Date().toISOString()
      });
      return { success: true };
    } catch (error) {
      throw new Error(parseAuthError(error));
    }
  },

  getActivityLog: async () => {
    return { data: [], message: 'Actividad no disponible sin backend.' };
  },

  toggle2FA: async () => {
    throw new Error('2FA no soportado en esta configuración Firebase.');
  },

  generateBackupCodes: async () => {
    throw new Error('2FA no soportado en esta configuración Firebase.');
  },

  verify2FACode: async () => {
    throw new Error('2FA no soportado en esta configuración Firebase.');
  }
};

export default authService;
