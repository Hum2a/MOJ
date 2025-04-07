# HMCTS Task Manager Client

Frontend React application for the HMCTS Task Manager.

## Deployment to Render

### Prerequisites

- A [Render](https://render.com) account
- Firebase project with Authentication enabled (same as used for the backend)

### Deploying to Render

1. Create a new Static Site in Render:
   - Go to your Render dashboard
   - Click **New** and select **Static Site**
   - Connect your GitHub repository

2. Configure the site:
   - **Name**: Choose a name (e.g., "hmcts-task-manager")
   - **Branch**: Select your main branch
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`

3. Add environment variables:
   - `REACT_APP_FIREBASE_API_KEY`: Your Firebase API key
   - `REACT_APP_FIREBASE_AUTH_DOMAIN`: Your Firebase auth domain
   - `REACT_APP_FIREBASE_PROJECT_ID`: Your Firebase project ID
   - `REACT_APP_FIREBASE_STORAGE_BUCKET`: Your Firebase storage bucket
   - `REACT_APP_FIREBASE_MESSAGING_SENDER_ID`: Your Firebase messaging sender ID
   - `REACT_APP_FIREBASE_APP_ID`: Your Firebase app ID
   - `REACT_APP_FIREBASE_MEASUREMENT_ID`: Your Firebase measurement ID

4. Click **Create Static Site**

### Connecting to the Backend API

The application is configured to automatically connect to:
- `http://localhost:5000/api` in development
- `https://moj-ifz0.onrender.com/api` in production

If you deploy the backend to a different URL, update the API URL in `src/services/taskService.js`.

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file with your Firebase configuration:
   ```
   REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
   REACT_APP_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
   REACT_APP_FIREBASE_PROJECT_ID=your_firebase_project_id
   REACT_APP_FIREBASE_STORAGE_BUCKET=your_firebase_storage_bucket
   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_firebase_messaging_sender_id
   REACT_APP_FIREBASE_APP_ID=your_firebase_app_id
   REACT_APP_FIREBASE_MEASUREMENT_ID=your_firebase_measurement_id
   ```
4. Start the development server:
   ```
   npm start
   ```

## Features

- User authentication (login, registration, password reset)
- Task management (create, read, update, delete)
- Task assignment to users
- Task filtering and sorting
- Responsive design

## Technologies

- React.js
- Firebase Authentication
- Firebase Firestore (via backend API)
- React Router
- CSS Modules
