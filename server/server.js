const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

// Initialize Firebase Admin
// Check if running in production (like on Render)
let firebaseConfig;

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  // On production, use environment variable
  try {
    const serviceAccountJson = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseConfig = {
      credential: admin.credential.cert(serviceAccountJson),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://ministryofjustice-c0344.firebaseio.com"
    };
    console.log('Using Firebase credentials from environment variable');
  } catch (error) {
    console.error('Error parsing Firebase service account from environment variable:', error);
    process.exit(1);
  }
} else {
  // In development, try to use the local file
  try {
    const serviceAccount = require('./ministryofjustice-c0344-firebase-adminsdk-fbsvc-29d8f0a066.json');
    firebaseConfig = {
      credential: admin.credential.cert(serviceAccount),
      databaseURL: process.env.FIREBASE_DATABASE_URL || "https://ministryofjustice-c0344.firebaseio.com"
    };
    console.log('Using Firebase credentials from local file');
  } catch (error) {
    console.error('Error loading Firebase service account from local file:', error);
    process.exit(1);
  }
}

// Initialize Firebase with the appropriate config
admin.initializeApp(firebaseConfig);

// Get Firestore instance
const db = admin.firestore();

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://hmcts.onrender.com'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  maxAge: 86400 // 24 hours in seconds
}));
app.use(express.json());

// Authentication middleware
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Helper function to create ISO date string
const createISODate = (date, time = null) => {
    try {
        if (!time) {
            // If no time provided, set to start of the day
            return new Date(`${date}T00:00:00`).toISOString();
        }
        // Combine date and time
        return new Date(`${date}T${time}`).toISOString();
    } catch (error) {
        throw new Error('Invalid date or time format');
    }
};

// Helper function to create activity log entry
const createActivityLog = (action, user, additionalInfo = {}) => {
  return {
    action,
    timestamp: new Date().toISOString(),
    user: {
      uid: user.uid,
      name: user.name || user.email,
      email: user.email
    },
    ...additionalInfo
  };
};

// Helper function to update user stats
const updateUserStats = async (userId, statType) => {
    try {
        const userRef = db.collection('users').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) return;
        
        const userData = userDoc.data();
        const stats = userData.stats || {
            tasksCreated: 0,
            tasksAssigned: 0,
            tasksCompleted: 0,
            lastTaskCompletedAt: null
        };
        
        const updateData = { stats: { ...stats } };
        
        switch (statType) {
            case 'created':
                updateData.stats.tasksCreated = (stats.tasksCreated || 0) + 1;
                break;
            case 'assigned':
                updateData.stats.tasksAssigned = (stats.tasksAssigned || 0) + 1;
                break;
            case 'completed':
                updateData.stats.tasksCompleted = (stats.tasksCompleted || 0) + 1;
                updateData.stats.lastTaskCompletedAt = new Date().toISOString();
                break;
            case 'uncompleted':
                if (stats.tasksCompleted > 0) {
                    updateData.stats.tasksCompleted = stats.tasksCompleted - 1;
                }
                break;
        }
        
        updateData.updatedAt = new Date().toISOString();
        await userRef.update(updateData);
    } catch (error) {
        console.error(`Error updating stats for user ${userId}:`, error);
    }
};

// API Routes

// Create a task
app.post('/api/tasks', authenticateUser, async (req, res) => {
    try {
        const { title, description, status, dueDate, dueTime, assignedUsers } = req.body;
        
        if (!title || !dueDate) {
            return res.status(400).json({ error: 'Title and due date are required' });
        }

        try {
            // Create ISO date string
            const dueDateISO = createISODate(dueDate, dueTime);

            // Create initial activity log entry
            const activityLog = [
              createActivityLog('created', req.user, { 
                initialStatus: status || 'Pending',
                assignedUsers: assignedUsers || []
              })
            ];

            const taskData = {
                title,
                description: description || '',
                status: status || 'Pending',
                dueDate: dueDateISO,
                hasTime: !!dueTime,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                assignedUsers: assignedUsers || [],
                createdBy: {
                    uid: req.user.uid,
                    email: req.user.email,
                    name: req.user.name || req.user.email
                },
                activityLog
            };

            const taskRef = await db.collection('tasks').add(taskData);
            const task = { id: taskRef.id, ...taskData };
            
            // Update creator's stats
            await updateUserStats(req.user.uid, 'created');
            
            // Update assignees' stats
            if (assignedUsers && assignedUsers.length > 0) {
                for (const userId of assignedUsers) {
                    await updateUserStats(userId, 'assigned');
                }
            }
            
            res.status(201).json(task);
        } catch (dateError) {
            return res.status(400).json({ error: 'Invalid date or time format' });
        }
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Get all tasks
app.get('/api/tasks', authenticateUser, async (req, res) => {
    try {
        const tasksSnapshot = await db.collection('tasks')
            .orderBy('createdAt', 'desc')
            .get();
        
        const tasks = [];
        tasksSnapshot.forEach(doc => {
            tasks.push({ id: doc.id, ...doc.data() });
        });
        
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// Get a single task by ID
app.get('/api/tasks/:id', authenticateUser, async (req, res) => {
    try {
        const taskDoc = await db.collection('tasks').doc(req.params.id).get();
        
        if (!taskDoc.exists) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        res.json({ id: taskDoc.id, ...taskDoc.data() });
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).json({ error: 'Failed to fetch task' });
    }
});

// Update task status
app.patch('/api/tasks/:id/status', authenticateUser, async (req, res) => {
    try {
        const { status } = req.body;
        if (!status || !['Pending', 'In Progress', 'Completed'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const taskRef = db.collection('tasks').doc(req.params.id);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const currentTask = taskDoc.data();
        const previousStatus = currentTask.status;

        // Only update user stats if status is changing
        if (previousStatus !== status) {
            // Check if task has assigned users
            if (currentTask.assignedUsers && currentTask.assignedUsers.length > 0) {
                for (const userId of currentTask.assignedUsers) {
                    // If new status is completed, increment completed count
                    if (status === 'Completed' && previousStatus !== 'Completed') {
                        await updateUserStats(userId, 'completed');
                    }
                    // If task was completed but now is not, decrement completed count
                    else if (previousStatus === 'Completed' && status !== 'Completed') {
                        await updateUserStats(userId, 'uncompleted');
                    }
                }
            }
        }

        // Create activity log entry for status change
        const activityLogEntry = createActivityLog('status_updated', req.user, {
            previousStatus,
            newStatus: status
        });

        await taskRef.update({
            status,
            updatedAt: new Date().toISOString(),
            lastUpdatedBy: {
                uid: req.user.uid,
                email: req.user.email,
                name: req.user.name || req.user.email
            },
            activityLog: admin.firestore.FieldValue.arrayUnion(activityLogEntry)
        });

        const updatedTask = await taskRef.get();
        res.json({ id: updatedTask.id, ...updatedTask.data() });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ error: 'Failed to update task status' });
    }
});

// Delete a task
app.delete('/api/tasks/:id', authenticateUser, async (req, res) => {
    try {
        const taskRef = db.collection('tasks').doc(req.params.id);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            return res.status(404).json({ error: 'Task not found' });
        }

        // Log the deletion action before deleting - optional since the task will be deleted
        const activityLogEntry = createActivityLog('deleted', req.user);
        await taskRef.update({
            activityLog: admin.firestore.FieldValue.arrayUnion(activityLogEntry)
        });

        await taskRef.delete();
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

// Update a task
app.put('/api/tasks/:id', authenticateUser, async (req, res) => {
    try {
        const { title, description, status, dueDate, dueTime, assignedUsers } = req.body;
        
        if (!title || !dueDate) {
            return res.status(400).json({ error: 'Title and due date are required' });
        }

        const taskRef = db.collection('tasks').doc(req.params.id);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            return res.status(404).json({ error: 'Task not found' });
        }
        
        const currentTask = taskDoc.data();
        const previousStatus = currentTask.status;
        const previousAssignedUsers = currentTask.assignedUsers || [];
        
        // Determine new users to add and existing users to remove
        const newAssignedUsers = assignedUsers || [];
        const usersToAdd = newAssignedUsers.filter(uid => !previousAssignedUsers.includes(uid));
        const usersRemoved = previousAssignedUsers.filter(uid => !newAssignedUsers.includes(uid));
        
        // Handle status change stats updates
        if (previousStatus !== status) {
            // Check if task has assigned users
            if (newAssignedUsers.length > 0) {
                for (const userId of newAssignedUsers) {
                    // If new status is completed, increment completed count
                    if (status === 'Completed' && previousStatus !== 'Completed') {
                        await updateUserStats(userId, 'completed');
                    }
                    // If task was completed but now is not, decrement completed count
                    else if (previousStatus === 'Completed' && status !== 'Completed') {
                        await updateUserStats(userId, 'uncompleted');
                    }
                }
            }
        }
        
        // Update stats for newly assigned users
        for (const userId of usersToAdd) {
            await updateUserStats(userId, 'assigned');
            // If task is already completed, increment completion count too
            if (status === 'Completed') {
                await updateUserStats(userId, 'completed');
            }
        }

        try {
            // Create ISO date string
            const dueDateISO = createISODate(dueDate, dueTime);

            // Create activity log entry for task update
            const changes = {};
            if (title !== currentTask.title) changes.title = { from: currentTask.title, to: title };
            if (description !== currentTask.description) changes.description = { from: currentTask.description, to: description };
            if (status !== currentTask.status) changes.status = { from: currentTask.status, to: status };
            if (dueDateISO !== currentTask.dueDate) changes.dueDate = { from: currentTask.dueDate, to: dueDateISO };
            if (!!dueTime !== currentTask.hasTime) changes.hasTime = { from: currentTask.hasTime, to: !!dueTime };
            
            if (usersToAdd.length > 0 || usersRemoved.length > 0) {
                changes.assignedUsers = {
                    added: usersToAdd,
                    removed: usersRemoved,
                    current: newAssignedUsers
                };
            }

            const activityLogEntry = createActivityLog('updated', req.user, changes);

            const taskData = {
                title,
                description: description || '',
                status: status || 'Pending',
                dueDate: dueDateISO,
                hasTime: !!dueTime,
                updatedAt: new Date().toISOString(),
                assignedUsers: newAssignedUsers,
                lastUpdatedBy: {
                    uid: req.user.uid,
                    email: req.user.email,
                    name: req.user.name || req.user.email
                }
            };

            await taskRef.update({
                ...taskData,
                activityLog: admin.firestore.FieldValue.arrayUnion(activityLogEntry)
            });
            
            const updatedTaskDoc = await taskRef.get();
            res.json({ id: updatedTaskDoc.id, ...updatedTaskDoc.data() });
        } catch (dateError) {
            return res.status(400).json({ error: 'Invalid date or time format' });
        }
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
}); 