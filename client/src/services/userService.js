import { getFirestore, doc, setDoc, updateDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { app } from '../firebase/firebase';

const db = getFirestore(app);

export const userService = {
  // Create or update user profile
  createUserProfile: async (user, additionalData = {}) => {
    try {
      const userRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userRef);

      if (!userSnapshot.exists()) {
        // Create new user profile
        const userData = {
          uid: user.uid,
          email: user.email,
          name: additionalData.name || user.displayName || '',
          role: additionalData.role || 'user',
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };

        await setDoc(userRef, userData);
        return userData;
      } else {
        // Update existing user's last login
        const updateData = {
          lastLogin: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        await updateDoc(userRef, updateData);
        return { ...userSnapshot.data(), ...updateData };
      }
    } catch (error) {
      console.error('Error creating/updating user profile:', error);
      throw error;
    }
  },

  // Update user profile
  updateUserProfile: async (uid, data) => {
    try {
      const userRef = doc(db, 'users', uid);
      const updateData = {
        ...data,
        updatedAt: new Date().toISOString()
      };
      await updateDoc(userRef, updateData);
      return updateData;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  // Get user profile
  getUserProfile: async (uid) => {
    try {
      const userRef = doc(db, 'users', uid);
      const userSnapshot = await getDoc(userRef);
      
      if (userSnapshot.exists()) {
        return userSnapshot.data();
      }
      return null;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const users = [];
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        users.push({
          uid: doc.id,
          email: userData.email,
          name: userData.name || userData.email
        });
      });
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
  },

  // Get user task statistics
  getUserTaskStats: async (userId) => {
    try {
      // Reference to Firestore database
      const db = getFirestore();
      
      // Get all tasks from Firestore
      const tasksSnapshot = await getDocs(collection(db, 'tasks'));
      const tasks = [];
      
      tasksSnapshot.forEach(doc => {
        tasks.push({ id: doc.id, ...doc.data() });
      });
      
      // Calculate statistics
      const stats = {
        created: tasks.filter(task => task.createdBy?.uid === userId).length,
        assigned: tasks.filter(task => task.assignedUsers?.includes(userId)).length,
        completed: tasks.filter(task => 
          task.assignedUsers?.includes(userId) && task.status === 'Completed'
        ).length
      };
      
      return stats;
    } catch (error) {
      console.error('Error getting user task statistics:', error);
      throw error;
    }
  },
}; 