import { securityConfig, securityUtils } from '../config/security';
import { 
  getAuth, 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult
} from 'firebase/auth';
import { app } from '../firebase/firebase';
import * as OTPAuth from 'otpauth';

class AuthService {
  constructor() {
    this.auth = getAuth(app);
    this.tokenKey = 'auth_token';
    this.refreshKey = 'refresh_token';
    this.mfaKey = 'mfa_secret';
    this.googleProvider = new GoogleAuthProvider();
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
          name: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL
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
          name: userCredential.user.displayName,
          photoURL: userCredential.user.photoURL
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

  // Login with Google
  async loginWithGoogle() {
    try {
      // Configure Google Auth Provider
      this.googleProvider.setCustomParameters({
        prompt: 'select_account'
      });
      
      // Sign in with popup
      const result = await signInWithPopup(this.auth, this.googleProvider);
      
      // Get the Google Access Token
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential.accessToken;
      
      // Return the user information
      return {
        user: {
          uid: result.user.uid,
          email: result.user.email,
          name: result.user.displayName,
          photoURL: result.user.photoURL
        },
        token
      };
    } catch (error) {
      let errorMessage = 'Failed to login with Google';
      
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in credentials';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Sign-in popup was closed before completing the sign-in';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Sign-in popup was blocked by the browser';
        // Fall back to redirect method if popup is blocked
        return this.loginWithGoogleRedirect();
      }
      
      throw new Error(errorMessage);
    }
  }
  
  // Login with Google using redirect method (fallback)
  async loginWithGoogleRedirect() {
    try {
      await signInWithRedirect(this.auth, this.googleProvider);
    } catch (error) {
      console.error('Google redirect error:', error);
      throw new Error('Failed to redirect to Google sign-in');
    }
  }
  
  // Handle the redirect result
  async getRedirectResult() {
    try {
      const result = await getRedirectResult(this.auth);
      if (result) {
        // User signed in after redirect
        return {
          user: {
            uid: result.user.uid,
            email: result.user.email,
            name: result.user.displayName,
            photoURL: result.user.photoURL
          }
        };
      }
      return null;
    } catch (error) {
      console.error('Google redirect result error:', error);
      throw new Error('Failed to complete Google sign-in');
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
      name: user.displayName,
      photoURL: user.photoURL
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