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

export const taskService = {
  // Get all tasks
  getAllTasks: async () => {
    const endpoint = '/tasks';
    logRequest('GET', endpoint);
    try {
      const response = await fetch(`${API_URL}${endpoint}`);
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
      const response = await fetch(`${API_URL}${endpoint}`);
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
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
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
      const response = await fetch(`${API_URL}${endpoint}`, {
        method: 'DELETE',
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
}; 