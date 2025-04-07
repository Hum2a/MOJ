import React, { useState, useEffect } from 'react';
import '../styles/TaskManager.css';
import { taskService } from '../services/taskService';

const logComponentAction = (action, data = null) => {
  console.log(`%c[TaskManager] ${action}`, 'color: #9C27B0; font-weight: bold;');
  if (data) {
    console.log('%c[Component Data]', 'color: #9C27B0; font-weight: bold;', data);
  }
};

const TaskManager = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate-asc');
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'Pending',
    dueDate: ''
  });
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
        dueDate: ''
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
            <p className="task-due-date">
              Due: {new Date(task.dueDate).toLocaleDateString()}
            </p>
            <select
              className="task-status"
              value={task.status}
              onChange={(e) => handleUpdateStatus(task.id, e.target.value)}
            >
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
            </select>
            <button
              className="delete-button"
              onClick={() => handleDeleteTask(task.id)}
            >
              Delete Task
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TaskManager;
