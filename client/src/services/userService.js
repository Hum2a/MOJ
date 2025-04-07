import { getFirestore, doc, setDoc, updateDoc, getDoc, collection, getDocs, increment, arrayUnion, arrayRemove } from 'firebase/firestore';
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
          updatedAt: new Date().toISOString(),
          stats: additionalData.stats || {
            tasksCreated: 0,
            tasksAssigned: 0,
            tasksCompleted: 0,
            lastTaskCompletedAt: null
          }
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
      // First try to get stats directly from user profile
      const userRef = doc(db, 'users', userId);
      const userSnapshot = await getDoc(userRef);
      
      if (userSnapshot.exists() && userSnapshot.data().stats) {
        const userStats = userSnapshot.data().stats;
        return {
          created: userStats.tasksCreated || 0,
          assigned: userStats.tasksAssigned || 0,
          completed: userStats.tasksCompleted || 0
        };
      }
      
      // If stats not available in profile, calculate them
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

  // Update stats when a task is created
  incrementTaskCreated: async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'stats.tasksCreated': increment(1),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating task created stats:', error);
    }
  },

  // Update stats when a task is assigned to a user
  incrementTaskAssigned: async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'stats.tasksAssigned': increment(1),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating task assigned stats:', error);
    }
  },

  // Update stats when a task is completed
  incrementTaskCompleted: async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        'stats.tasksCompleted': increment(1),
        'stats.lastTaskCompletedAt': new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error updating task completed stats:', error);
    }
  },

  // Update user stats for all assigned users when a task status changes
  updateTaskStatusStats: async (task, previousStatus, newStatus) => {
    // Only proceed if we have assigned users
    if (!task.assignedUsers || task.assignedUsers.length === 0) {
      return;
    }

    // If task becomes complete, increment completed count for all assigned users
    if (newStatus === 'Completed' && previousStatus !== 'Completed') {
      for (const userId of task.assignedUsers) {
        await userService.incrementTaskCompleted(userId);
      }
    }
    // If task was completed but is now not completed, decrement the count
    else if (previousStatus === 'Completed' && newStatus !== 'Completed') {
      for (const userId of task.assignedUsers) {
        try {
          const userRef = doc(db, 'users', userId);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists() && userDoc.data().stats && userDoc.data().stats.tasksCompleted > 0) {
            await updateDoc(userRef, {
              'stats.tasksCompleted': increment(-1),
              updatedAt: new Date().toISOString()
            });
          }
        } catch (error) {
          console.error(`Error updating task completed stats for user ${userId}:`, error);
        }
      }
    }
  }
}; 