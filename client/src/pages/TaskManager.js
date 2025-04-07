import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/TaskManager.css';
import { taskService } from '../services/taskService';
import { userService } from '../services/userService';
import ProfileModal from '../components/ProfileModal';

const logComponentAction = (action, data = null) => {
  console.log(`%c[TaskManager] ${action}`, 'color: #9C27B0; font-weight: bold;');
  if (data) {
    console.log('%c[Component Data]', 'color: #9C27B0; font-weight: bold;', data);
  }
};

// Activity Log Modal Component
const ActivityLogModal = ({ task, onClose, users = [] }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    // Fade in animation
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);
  
  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };
  
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    try {
      return new Date(timestamp).toLocaleString();
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return 'Invalid date';
    }
  };
  
  const getActionIcon = (action) => {
    if (!action) return '📝';
    
    switch (action) {
      case 'created': return '🆕';
      case 'updated': return '✏️';
      case 'status_updated': return '🔄';
      case 'deleted': return '🗑️';
      default: return '📝';
    }
  };
  
  const getActionLabel = (action) => {
    if (!action) return 'Activity';
    
    switch (action) {
      case 'created': return 'Created';
      case 'updated': return 'Updated';
      case 'status_updated': return 'Status Changed';
      case 'deleted': return 'Deleted';
      default: return action;
    }
  };
  
  const getStatusLabel = (status) => {
    switch (status) {
      case 'Pending': return 'Pending';
      case 'In Progress': return 'In Progress';
      case 'Completed': return 'Completed';
      default: return status;
    }
  };
  
  const getStatusClass = (status) => {
    switch (status) {
      case 'Pending': return 'status-pending';
      case 'In Progress': return 'status-in-progress';
      case 'Completed': return 'status-completed';
      default: return '';
    }
  };
  
  const getUserName = (uid) => {
    if (!uid) return 'Unknown user';
    const user = users.find(u => u.uid === uid);
    return user ? (user.name || uid) : uid;
  };
  
  const renderActivityDetails = (activity) => {
    if (!activity) return null;
    
    const { action, additionalInfo = {} } = activity;
    
    if (action === 'status_updated' && additionalInfo && additionalInfo.previousStatus && additionalInfo.newStatus) {
      return (
        <div className="activity-detail">
          <div className="status-change">
            <span className={`status-badge ${getStatusClass(additionalInfo.previousStatus)}`}>
              {getStatusLabel(additionalInfo.previousStatus)}
            </span>
            <span className="status-arrow">→</span>
            <span className={`status-badge ${getStatusClass(additionalInfo.newStatus)}`}>
              {getStatusLabel(additionalInfo.newStatus)}
            </span>
          </div>
        </div>
      );
    }
    
    if (action === 'created' && additionalInfo) {
      return (
        <div className="activity-detail">
          {additionalInfo.initialStatus && (
            <p>
              Initial status: <span className={`status-badge ${getStatusClass(additionalInfo.initialStatus)}`}>
                {getStatusLabel(additionalInfo.initialStatus)}
              </span>
            </p>
          )}
          {additionalInfo.assignedUsers && additionalInfo.assignedUsers.length > 0 && (
            <p>
              Initial assignees: {additionalInfo.assignedUsers.map(uid => getUserName(uid)).join(', ')}
            </p>
          )}
        </div>
      );
    }
    
    if (action === 'updated' && additionalInfo) {
      const hasChanges = Object.keys(additionalInfo).length > 0;
      
      if (!hasChanges) return null;
      
      return (
        <div className="activity-detail">
          {additionalInfo.title && (
            <p>Title: <span className="changed-from">{additionalInfo.title.from}</span> → <span className="changed-to">{additionalInfo.title.to}</span></p>
          )}
          {additionalInfo.description && (
            <p>Description updated</p>
          )}
          {additionalInfo.status && (
            <p>Status: <span className={`status-badge ${getStatusClass(additionalInfo.status.from)}`}>{getStatusLabel(additionalInfo.status.from)}</span> → <span className={`status-badge ${getStatusClass(additionalInfo.status.to)}`}>{getStatusLabel(additionalInfo.status.to)}</span></p>
          )}
          {additionalInfo.dueDate && (
            <p>Due date changed</p>
          )}
          {additionalInfo.assignedUsers && (
            <div>
              {additionalInfo.assignedUsers.added && additionalInfo.assignedUsers.added.length > 0 && (
                <p>Added users: {additionalInfo.assignedUsers.added.map(uid => getUserName(uid)).join(', ')}</p>
              )}
              {additionalInfo.assignedUsers.removed && additionalInfo.assignedUsers.removed.length > 0 && (
                <p>Removed users: {additionalInfo.assignedUsers.removed.map(uid => getUserName(uid)).join(', ')}</p>
              )}
            </div>
          )}
        </div>
      );
    }
    
    return null;
  };
  
  if (!task) {
    console.log('No task provided to ActivityLogModal');
    return null;
  }
  
  const activityLog = task.activityLog || [];
  console.log('Activity log in modal:', activityLog);
  
  return (
    <div 
      className={`modal-backdrop ${isVisible ? 'visible' : ''}`} 
      onClick={handleClose}
    >
      <div 
        className={`activity-modal ${isVisible ? 'visible' : ''}`} 
        onClick={e => e.stopPropagation()}
      >
        <button className="close-button" onClick={handleClose}>×</button>
        <div className="activity-header">
          <h2>Activity Log - {task.title}</h2>
        </div>
        <div className="activity-content">
          {activityLog.length > 0 ? (
            <div className="activity-list">
              {[...activityLog].reverse().map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {getActionIcon(activity.action)}
                  </div>
                  <div className="activity-body">
                    <div className="activity-title">
                      <span className="activity-action">{getActionLabel(activity.action)}</span>
                      <span className="activity-time">{formatTimestamp(activity.timestamp)}</span>
                    </div>
                    <div className="activity-user">
                      by {activity.user ? (activity.user.name || activity.user.email) : 'Unknown user'}
                    </div>
                    {activity && renderActivityDetails(activity)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-activity">No activity recorded for this task.</div>
          )}
        </div>
      </div>
    </div>
  );
};

const TaskManager = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState('dueDate-asc');
  const [users, setUsers] = useState([]);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    status: 'Pending',
    dueDate: '',
    dueTime: '',
    assignedUsers: []
  });
  const [editingTask, setEditingTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [viewActivityTask, setViewActivityTask] = useState(null);

  useEffect(() => {
    logComponentAction('Component Mounted');
    fetchTasks();
    fetchUsers();
  }, []);

  useEffect(() => {
    filterAndSortTasks();
  }, [searchTerm, statusFilter, sortBy, tasks]);

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

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
      
      // Add debug logging to inspect task structure
      console.log('Tasks received from API:', tasksList);
      if (tasksList.length > 0) {
        console.log('First task structure:', tasksList[0]);
        console.log('Activity log exists:', !!tasksList[0].activityLog);
        if (tasksList[0].activityLog) {
          console.log('Activity log entries:', tasksList[0].activityLog.length);
          console.log('First activity log entry:', tasksList[0].activityLog[0]);
        }
      }
      
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

  const fetchUsers = async () => {
    try {
      const usersList = await userService.getAllUsers();
      setUsers(usersList);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const fetchUserProfile = async () => {
    try {
      console.log('Fetching user profile for:', user.uid);
      const profile = await userService.getUserProfile(user.uid);
      console.log('User profile fetched:', profile);
      setUserProfile(profile);
    } catch (error) {
      console.error('Error fetching user profile:', error);
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

      // Log detailed information about what we're sending
      console.log('Task creation - DETAILED DATA LOG:');
      console.log('Raw dueDate from form:', newTask.dueDate);
      console.log('dueDate validity:', !isNaN(new Date(newTask.dueDate).getTime()));
      console.log('dueTime from form:', newTask.dueTime);
      console.log('Full request payload:', {
        ...newTask,
        dueDate: newTask.dueDate
      });

      // Send the original date string instead of the ISO string
      const task = await taskService.createTask({
        ...newTask,
        // Don't convert to ISO string, server expects YYYY-MM-DD format
        dueDate: newTask.dueDate
      });
      
      logComponentAction('Task Created', task);
      setTasks([...tasks, task]);
      setNewTask({
        title: '',
        description: '',
        status: 'Pending',
        dueDate: '',
        dueTime: '',
        assignedUsers: []
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

  const handleProfileClick = () => {
    console.log('Profile button clicked');
    console.log('Current user profile state:', userProfile);
    console.log('Current user state:', user);
    setShowProfileModal(true);
  };

  if (loading) {
    logComponentAction('Loading State');
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="task-manager-container">
      <header className="task-manager-header">
        <div className="header-left">
          <h1 className="task-manager-title">Task Manager</h1>
          {user && (
            <div className="welcome-message">
              Welcome back, {user.name || user.email.split('@')[0]}!
            </div>
          )}
        </div>
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
            className="profile-button"
            onClick={handleProfileClick}
          >
            <span className="button-icon">👤</span> Profile
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
            <label htmlFor="assignedUsers">Assign Users (optional)</label>
            <select
              id="assignedUsers"
              name="assignedUsers"
              multiple
              value={newTask.assignedUsers}
              onChange={(e) => {
                const selectedUsers = Array.from(e.target.selectedOptions, option => option.value);
                // Check if "all" is selected
                if (selectedUsers.includes('all')) {
                  // If "all" is selected, include all user IDs
                  setNewTask(prev => ({
                    ...prev,
                    assignedUsers: users.map(user => user.uid)
                  }));
                } else {
                  setNewTask(prev => ({
                    ...prev,
                    assignedUsers: selectedUsers
                  }));
                }
              }}
              className="user-select"
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user.uid} value={user.uid}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <small className="help-text">Hold Ctrl (Windows) or Cmd (Mac) to select multiple users, or choose "All Users" to assign to everyone</small>
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
            <label htmlFor="edit-assignedUsers">Assign Users (optional)</label>
            <select
              id="edit-assignedUsers"
              name="assignedUsers"
              multiple
              value={editingTask.assignedUsers || []}
              onChange={(e) => {
                const selectedUsers = Array.from(e.target.selectedOptions, option => option.value);
                // Check if "all" is selected
                if (selectedUsers.includes('all')) {
                  // If "all" is selected, include all user IDs
                  setEditingTask(prev => ({
                    ...prev,
                    assignedUsers: users.map(user => user.uid)
                  }));
                } else {
                  setEditingTask(prev => ({
                    ...prev,
                    assignedUsers: selectedUsers
                  }));
                }
              }}
              className="user-select"
            >
              <option value="all">All Users</option>
              {users.map(user => (
                <option key={user.uid} value={user.uid}>
                  {user.name} ({user.email})
                </option>
              ))}
            </select>
            <small className="help-text">Hold Ctrl (Windows) or Cmd (Mac) to select multiple users, or choose "All Users" to assign to everyone</small>
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
              {task.assignedUsers && task.assignedUsers.length > 0 && (
                <p className="task-assigned">
                  Assigned to: {task.assignedUsers.map(uid => {
                    const user = users.find(u => u.uid === uid);
                    return user ? user.name : 'Unknown';
                  }).join(', ')}
                </p>
              )}
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
            <button 
              className="activity-log-button"
              onClick={() => setViewActivityTask(task)}
            >
              <span className="button-icon">📋</span> View Activity Log
            </button>
          </div>
        ))}
      </div>

      {/* Activity Log Modal */}
      {viewActivityTask && (
        <ActivityLogModal 
          task={viewActivityTask} 
          onClose={() => setViewActivityTask(null)}
          users={users}
        />
      )}

      {/* Profile Modal */}
      {showProfileModal && (
        <ProfileModal 
          profile={userProfile} 
          onClose={() => setShowProfileModal(false)} 
        />
      )}
    </div>
  );
};

export default TaskManager;
