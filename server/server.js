const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
require('dotenv').config();

const app = express();

// Initialize Firebase Admin
const serviceAccount = require('./ministryofjustice-c0344-firebase-adminsdk-fbsvc-29d8f0a066.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ministryofjustice-c0344.firebaseio.com"
});

// Get Firestore instance
const db = admin.firestore();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes

// Create a task
app.post('/api/tasks', async (req, res) => {
    try {
        const { title, description, status, dueDate } = req.body;
        
        if (!title || !dueDate) {
            return res.status(400).json({ error: 'Title and due date are required' });
        }

        const taskData = {
            title,
            description: description || '',
            status: status || 'Pending',
            dueDate: new Date(dueDate).toISOString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        const taskRef = await db.collection('tasks').add(taskData);
        const task = { id: taskRef.id, ...taskData };
        
        res.status(201).json(task);
    } catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// Get all tasks
app.get('/api/tasks', async (req, res) => {
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
app.get('/api/tasks/:id', async (req, res) => {
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
app.patch('/api/tasks/:id/status', async (req, res) => {
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

        await taskRef.update({
            status,
            updatedAt: new Date().toISOString()
        });

        const updatedTask = await taskRef.get();
        res.json({ id: updatedTask.id, ...updatedTask.data() });
    } catch (error) {
        console.error('Error updating task status:', error);
        res.status(500).json({ error: 'Failed to update task status' });
    }
});

// Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
    try {
        const taskRef = db.collection('tasks').doc(req.params.id);
        const taskDoc = await taskRef.get();

        if (!taskDoc.exists) {
            return res.status(404).json({ error: 'Task not found' });
        }

        await taskRef.delete();
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        console.error('Error deleting task:', error);
        res.status(500).json({ error: 'Failed to delete task' });
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