import { securityConfig, securityUtils } from '../config/security';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import { app } from '../firebase/firebase';
import * as OTPAuth from 'otpauth';

class AuthService {
  constructor() {
    this.auth = getAuth(app);
    this.tokenKey = 'auth_token';
    this.refreshKey = 'refresh_token';
    this.mfaKey = 'mfa_secret';
  }

  // Initialize authentication state
  async init() {
    return new Promise((resolve) => {
      this.auth.onAuthStateChanged((user) => {
        resolve(user);
      });
    });
  }

  // Register new user
  async register({ email, password, name }) {
    try {
      // Validate password strength
      const passwordValidation = securityUtils.validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error('Password does not meet security requirements');
      }

      // Create user with Firebase
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      // Update profile with name
      await updateProfile(userCredential.user, {
        displayName: name
      });

      return {
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName
        }
      };
    } catch (error) {
      let errorMessage = 'Failed to register';
      switch (error.code) {
        case 'auth/email-already-in-use':
          errorMessage = 'Email is already registered';
          break;
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/operation-not-allowed':
          errorMessage = 'Email/password accounts are not enabled';
          break;
        case 'auth/weak-password':
          errorMessage = 'Password is too weak';
          break;
        default:
          errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  // Login with credentials
  async login({ email, password }) {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      return {
        user: {
          uid: userCredential.user.uid,
          email: userCredential.user.email,
          name: userCredential.user.displayName
        }
      };
    } catch (error) {
      let errorMessage = 'Failed to login';
      switch (error.code) {
        case 'auth/invalid-email':
          errorMessage = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          errorMessage = 'Account has been disabled';
          break;
        case 'auth/user-not-found':
          errorMessage = 'User not found';
          break;
        case 'auth/wrong-password':
          errorMessage = 'Invalid password';
          break;
        default:
          errorMessage = error.message;
      }
      throw new Error(errorMessage);
    }
  }

  // Logout user
  async logout() {
    try {
      await signOut(this.auth);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  // Get current user
  getCurrentUser() {
    const user = this.auth.currentUser;
    if (!user) return null;

    return {
      uid: user.uid,
      email: user.email,
      name: user.displayName
    };
  }

  // Token management
  async getToken() {
    const user = this.auth.currentUser;
    if (!user) return null;
    return await user.getIdToken();
  }

  // Error handling
  handleAuthError(error) {
    console.error('Auth error:', {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
    });
  }
}

export const authService = new AuthService(); 