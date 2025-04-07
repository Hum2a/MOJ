import { getAuth } from 'firebase/auth';

const API_URL = 'http://localhost:5000/api';

const logRequest = (method, endpoint, data = null) => {
  console.log(`%c[API Request] ${method} ${endpoint}`, 'color: #2196F3; font-weight: bold;');
  if (data) {
    console.log('%c[Request Data]', 'color: #4CAF50; font-weight: bold;', data);
  }
};

const logResponse = (method, endpoint, response) => {
  console.log(`%c[API Response] ${method} ${endpoint}`, 'color: #4CAF50; font-weight: bold;', response);
};

const logError = (method, endpoint, error) => {
  console.error(`%c[API Error] ${method} ${endpoint}`, 'color: #F44336; font-weight: bold;', error);
};

// Helper function to get the current user's token
const getAuthToken = async () => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated');
  }
  return await user.getIdToken();
};

// Helper function to create headers with auth token
const createHeaders = async (contentType = true) => {
  const token = await getAuthToken();
  const headers = {
    'Authorization': `Bearer ${token}`
  };
  if (contentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

export const taskService = {
  // Get all tasks
  getAllTasks: async () => {
    const endpoint = '/tasks';
    logRequest('GET', endpoint);
    try {
      const headers = await createHeaders(false);
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      logResponse('GET', endpoint, data);
      return data;
    } catch (error) {
      logError('GET', endpoint, error);
      throw error;
    }
  },

  // Get a single task by ID
  getTaskById: async (id) => {
    const endpoint = `/tasks/${id}`;
    logRequest('GET', endpoint);
    try {
      const headers = await createHeaders(false);
      const response = await fetch(`${API_URL}${endpoint}`, {
        headers
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      logResponse('GET', endpoint, data);
      return data;
    } catch (error) {
      logError('GET', endpoint, error);
      throw error;
    }
  },

  // Create a new task
  createTask: async (taskData) => {
    const endpoint = '/tasks';
    logRequest('POST', endpoint, taskData);
    try {
      const headers = await createHeaders();
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      logResponse('POST', endpoint, data);
      return data;
    } catch (error) {
      logError('POST', endpoint, error);
      throw error;
    }
  },

  // Update task status
  updateTaskStatus: async (id, status) => {
    const endpoint = `/tasks/${id}/status`;
    const data = { status };
    logRequest('PATCH', endpoint, data);
    try {
      const headers = await createHeaders();
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const responseData = await response.json();
      logResponse('PATCH', endpoint, responseData);
      return responseData;
    } catch (error) {
      logError('PATCH', endpoint, error);
      throw error;
    }
  },

  // Delete a task
  deleteTask: async (id) => {
    const endpoint = `/tasks/${id}`;
    logRequest('DELETE', endpoint);
    try {
      const headers = await createHeaders();
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
        headers
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      logResponse('DELETE', endpoint, data);
      return data;
    } catch (error) {
      logError('DELETE', endpoint, error);
      throw error;
    }
  },

  // Update a task
  updateTask: async (id, taskData) => {
    const endpoint = `/tasks/${id}`;
    logRequest('PUT', endpoint, taskData);
    try {
      const headers = await createHeaders();
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(taskData),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      logResponse('PUT', endpoint, data);
      return data;
    } catch (error) {
      logError('PUT', endpoint, error);
      throw error;
    }
  },
}; 