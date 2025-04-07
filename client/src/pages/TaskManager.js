import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/TaskManager.css';
import { taskService } from '../services/taskService';

const logComponentAction = (action, data = null) => {
  console.log(`%c[TaskManager] ${action}`, 'color: #9C27B0; font-weight: bold;');
  if (data) {
    console.log('%c[Component Data]', 'color: #9C27B0; font-weight: bold;', data);
  }
};

const TaskManager = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate-asc');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'Pending',
    dueDate: '',
    dueTime: ''
  });
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);

  useEffect(() => {
    logComponentAction('Component Mounted');
    fetchTasks();
  }, []);

  useEffect(() => {
    filterAndSortTasks();
  }, [searchTerm, statusFilter, sortBy, tasks]);

  const filterAndSortTasks = () => {
    let filtered = [...tasks];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(task => 
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.status.toLowerCase().includes(searchLower)
      );
    }

    // Apply status filter
    if (statusFilter !== 'All') {
      filtered = filtered.filter(task => task.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const [field, direction] = sortBy.split('-');
      
      if (field === 'dueDate') {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        return direction === 'asc' ? dateA - dateB : dateB - dateA;
      }
      
      if (field === 'status') {
        const statusOrder = { 'Pending': 1, 'In Progress': 2, 'Completed': 3 };
        return direction === 'asc' 
          ? statusOrder[a.status] - statusOrder[b.status]
          : statusOrder[b.status] - statusOrder[a.status];
      }
      
      return 0;
    });

    setFilteredTasks(filtered);
  };

  const fetchTasks = async () => {
    logComponentAction('Fetching Tasks');
    try {
      setLoading(true);
      setError(null);
      const tasksList = await taskService.getAllTasks();
      logComponentAction('Tasks Fetched', tasksList);
      setTasks(tasksList);
      setFilteredTasks(tasksList);
    } catch (error) {
      setError('Failed to fetch tasks. Please try again later.');
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    logComponentAction('Input Changed', { name, value });
    setNewTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    logComponentAction('Adding New Task', newTask);
    
    if (!newTask.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!newTask.dueDate) {
      setError('Due date is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Ensure the date is valid before sending
      const dueDate = new Date(newTask.dueDate);
      if (isNaN(dueDate.getTime())) {
        setError('Invalid date format');
        return;
      }

      const task = await taskService.createTask({
        ...newTask,
        dueDate: dueDate.toISOString()
      });
      
      logComponentAction('Task Created', task);
      setTasks([...tasks, task]);
      setNewTask({
        title: '',
        description: '',
        status: 'Pending',
        dueDate: '',
        dueTime: ''
      });
      setShowAddForm(false);
    } catch (error) {
      setError('Failed to create task. Please try again.');
      console.error('Error creating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId, newStatus) => {
    logComponentAction('Updating Task Status', { taskId, newStatus });
    try {
      setLoading(true);
      setError(null);
      const updatedTask = await taskService.updateTaskStatus(taskId, newStatus);
      logComponentAction('Task Status Updated', updatedTask);
      
      setTasks(tasks.map(task => 
        task.id === taskId ? updatedTask : task
      ));
    } catch (error) {
      setError('Failed to update task status. Please try again.');
      console.error('Error updating task status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    logComponentAction('Deleting Task', { taskId });
    try {
      setLoading(true);
      setError(null);
      await taskService.deleteTask(taskId);
      logComponentAction('Task Deleted', { taskId });
      setTasks(tasks.filter(task => task.id !== taskId));
    } catch (error) {
      setError('Failed to delete task. Please try again.');
      console.error('Error deleting task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    logComponentAction('Status Filter Changed', e.target.value);
  };

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
    logComponentAction('Sort Changed', e.target.value);
  };

  const handleEditClick = (task) => {
    logComponentAction('Edit Task Clicked', task);
    const date = new Date(task.dueDate);
    
    // Format the date and time for the form inputs
    const formattedDate = date.toISOString().split('T')[0];
    const formattedTime = task.hasTime ? 
      `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}` : 
      '';

    setEditingTask({
      ...task,
      dueDate: formattedDate,
      dueTime: formattedTime
    });
  };

  const handleEditCancel = () => {
    logComponentAction('Edit Cancelled');
    setEditingTask(null);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    logComponentAction('Submitting Edit', editingTask);

    if (!editingTask.title.trim()) {
      setError('Title is required');
      return;
    }

    if (!editingTask.dueDate) {
      setError('Due date is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Create a copy of the task data without the dueTime field
      const { dueTime, ...taskDataWithoutTime } = editingTask;
      
      // Send the task data with dueTime as a separate field
      const updatedTask = await taskService.updateTask(editingTask.id, {
        ...taskDataWithoutTime,
        dueTime: editingTask.dueTime || null
      });

      logComponentAction('Task Updated', updatedTask);
      setTasks(tasks.map(task => 
        task.id === updatedTask.id ? updatedTask : task
      ));
      setEditingTask(null);
    } catch (error) {
      setError('Failed to update task. Please try again.');
      console.error('Error updating task:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    logComponentAction('Edit Input Changed', { name, value });
    setEditingTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDueDate = (dueDate, hasTime) => {
    const date = new Date(dueDate);
    if (hasTime) {
      return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    return date.toLocaleDateString();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (loading) {
    logComponentAction('Loading State');
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="task-manager-container">
      <header className="task-manager-header">
        <h1 className="task-manager-title">Task Manager</h1>
        <div className="header-actions">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="search-input"
            />
            <span className="search-icon">🔍</span>
          </div>
          <div className="filter-sort-container">
            <select
              className="filter-select"
              value={statusFilter}
              onChange={handleStatusFilterChange}
              aria-label="Filter by status"
            >
              <option value="All">All Status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <select
              className="sort-select"
              value={sortBy}
              onChange={handleSortChange}
              aria-label="Sort tasks"
            >
              <option value="dueDate-asc">Due Date (Earliest)</option>
              <option value="dueDate-desc">Due Date (Latest)</option>
              <option value="status-asc">Status (Pending → Completed)</option>
              <option value="status-desc">Status (Completed → Pending)</option>
            </select>
          </div>
          <button 
            className="add-task-button" 
            onClick={() => {
              logComponentAction('Toggle Add Form', { show: !showAddForm });
              setShowAddForm(!showAddForm);
            }}
          >
            {showAddForm ? 'Cancel' : 'Add New Task'}
          </button>
          <button 
            className="logout-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      {error && <div className="error-message">{error}</div>}

      {(searchTerm || statusFilter !== 'All') && (
        <div className="search-results-info">
          Showing {filteredTasks.length} of {tasks.length} tasks
          {statusFilter !== 'All' && ` (${statusFilter} status)`}
        </div>
      )}

      {showAddForm && (
        <form className="task-form" onSubmit={handleAddTask}>
          <div className="form-group">
            <label htmlFor="title">Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={newTask.title}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={newTask.description}
              onChange={handleInputChange}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="dueDate">Due Date</label>
              <input
                type="date"
                id="dueDate"
                name="dueDate"
                value={newTask.dueDate}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dueTime">Due Time (optional)</label>
              <input
                type="time"
                id="dueTime"
                name="dueTime"
                value={newTask.dueTime}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              name="status"
              value={newTask.status}
              onChange={handleInputChange}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <button type="submit" className="submit-button">
            Create Task
          </button>
        </form>
      )}

      {editingTask && (
        <form className="task-form edit-form" onSubmit={handleEditSubmit}>
          <h2>Edit Task</h2>
          <div className="form-group">
            <label htmlFor="edit-title">Title</label>
            <input
              type="text"
              id="edit-title"
              name="title"
              value={editingTask.title}
              onChange={handleEditInputChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="edit-description">Description</label>
            <textarea
              id="edit-description"
              name="description"
              value={editingTask.description}
              onChange={handleEditInputChange}
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="edit-dueDate">Due Date</label>
              <input
                type="date"
                id="edit-dueDate"
                name="dueDate"
                value={editingTask.dueDate}
                onChange={handleEditInputChange}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="edit-dueTime">Due Time (optional)</label>
              <input
                type="time"
                id="edit-dueTime"
                name="dueTime"
                value={editingTask.dueTime || ''}
                onChange={handleEditInputChange}
              />
            </div>
          </div>
          <div className="form-group">
            <label htmlFor="edit-status">Status</label>
            <select
              id="edit-status"
              name="status"
              value={editingTask.status}
              onChange={handleEditInputChange}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
          <div className="form-actions">
            <button type="submit" className="submit-button">
              Update Task
            </button>
            <button 
              type="button" 
              className="cancel-button"
              onClick={handleEditCancel}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="task-grid">
        {filteredTasks.map(task => (
          <div 
            className="task-card" 
            key={task.id}
            data-status={task.status}
          >
            <span className="task-id">ID: {task.id}</span>
            <h3 className="task-title">{task.title}</h3>
            <p className="task-description">{task.description}</p>
            <div className="task-metadata">
              <p className="task-due-date">
                Due: {formatDueDate(task.dueDate, task.hasTime)}
              </p>
              <p className="task-issuer">
                Created by: {task.createdBy?.name || task.createdBy?.email || 'Unknown'}
              </p>
              {task.lastUpdatedBy && (
                <p className="task-last-updated">
                  Last updated by: {task.lastUpdatedBy.name || task.lastUpdatedBy.email}
                </p>
              )}
            </div>
            <select
              className="task-status"
              value={task.status}
              onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <div className="task-actions">
              <button
                className="edit-button"
                onClick={() => handleEditClick(task)}
              >
                Edit Task
              </button>
              <button
                className="delete-button"
                onClick={() => handleDeleteTask(task.id)}
              >
                Delete Task
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskManager;
