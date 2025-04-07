# HMCTS Task Manager Server

Backend API server for the HMCTS Task Manager application. This server provides secure API endpoints for managing tasks, with Firebase integration for authentication and data storage.

## Deployment to Render

### Prerequisites

- A [Render](https://render.com) account
- A Firebase project with Firestore and Authentication enabled
- Firebase service account credentials

### Setting up Firebase Service Account on Render

1. Download your Firebase service account key file (JSON format) from the Firebase Console:
   - Go to **Project settings** > **Service accounts**
   - Click **Generate new private key**
   - Save the JSON file securely

2. Convert the JSON file to a single line string:
   - Open the JSON file in a text editor
   - Copy all the content
   - Use an online tool like [JSON Escape/Unescape](https://www.freeformatter.com/json-escape.html) to escape the JSON
   - Or run this command: `cat your-service-account.json | jq -c .`

3. Configure environment variables in Render:
   - Go to your Render dashboard
   - Select your service
   - Go to **Environment**
   - Add the following environment variables:
     - `FIREBASE_SERVICE_ACCOUNT`: Paste the escaped JSON string from step 2
     - `FIREBASE_DATABASE_URL`: Your Firebase database URL (e.g., `https://your-project-id.firebaseio.com`)
     - `NODE_ENV`: Set to `production`
     - `PORT`: Render will set this automatically, but you can specify `5000` as a fallback

### Deploying to Render

1. Create a new Web Service in Render
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: Choose a name for your service
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`
   - **Plan**: Select the appropriate plan (Free tier works for testing)

4. Set the environment variables as described above
5. Click **Create Web Service**

### Configuring CORS for Production

The server is already configured to accept requests from:
- `http://localhost:3000` (for local development)
- `https://hmcts.onrender.com` (for production)

If you deploy the frontend to a different URL, make sure to update the CORS configuration in `server.js`.

## Local Development

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file based on `.env.example`
4. Place your Firebase Admin SDK service account JSON file in the server directory
5. Start the server:
   ```
   npm run dev
   ```

## API Endpoints

- `GET /api/tasks` - Get all tasks
- `GET /api/tasks/:id` - Get a single task by ID
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `PATCH /api/tasks/:id/status` - Update task status

## Authentication

All API endpoints require authentication with a Firebase ID token in the `Authorization` header:

```
Authorization: Bearer <firebase-id-token>
``` 