# TaskFlow Backend API

Express.js + MySQL backend for TaskFlow application.

## 🚀 Quick Start

### Prerequisites

- Node.js (v18 or higher)
- MySQL Server (v8.0 or higher)

### Installation

1. **Navigate to server directory:**
   ```bash
   cd server
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up MySQL database:**
   
   Create a new database in MySQL:
   ```sql
   CREATE DATABASE taskflow_local;
   ```

4. **Set up environment variables:**
   
   Create a `.env` file in the server directory with the following:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development

   # MySQL Database Configuration
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=taskflow_local
   DB_USER=root
   DB_PASSWORD=your_mysql_password

   # JWT Secret for signing tokens
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

   # CORS Configuration
   CORS_ORIGIN=http://localhost:8080,http://localhost:5173

   # Frontend URL (for OAuth redirects)
   FRONTEND_URL=http://localhost:8080

   # Google OAuth Configuration (Optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

   # Email Configuration (Optional - for email verification)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

5. **Start the server:**
   ```bash
   # Development mode (with auto-reload)
   npm run dev
   
   # Production mode
   npm start
   ```

The server will start on `http://localhost:5000` and automatically create the database tables.

## 📦 MySQL Setup

### Option 1: Local MySQL Installation

1. **Download MySQL:**
   - Windows: https://dev.mysql.com/downloads/installer/
   - Mac: `brew install mysql`
   - Linux: `sudo apt-get install mysql-server`

2. **Start MySQL service:**
   ```bash
   # Windows (run as Administrator)
   net start MySQL80
   
   # Mac
   brew services start mysql
   
   # Linux
   sudo systemctl start mysql
   ```

3. **Create database:**
   ```bash
   mysql -u root -p
   ```
   Then in MySQL shell:
   ```sql
   CREATE DATABASE taskflow_local;
   EXIT;
   ```

4. **Update `.env` file with your MySQL credentials**

### Option 2: MySQL Cloud Services

You can also use cloud MySQL services like:
- **AWS RDS** - Amazon Relational Database Service
- **Google Cloud SQL** - Google Cloud MySQL
- **Azure Database for MySQL** - Microsoft Azure
- **PlanetScale** - Serverless MySQL platform

Update your `.env` file with the connection details provided by your cloud service.

## 📡 API Endpoints

### Authentication
- `POST /api/auth/send-code` - Send verification code to email
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user (protected)
- `POST /api/auth/google` - Google OAuth login
- `GET /api/auth/google/callback` - Google OAuth callback

### Boards
- `GET /api/boards` - Get all boards for user (protected)
- `GET /api/boards/community` - Get all public boards
- `GET /api/boards/:id` - Get a single board (protected)
- `POST /api/boards` - Create a board (protected)
- `PUT /api/boards/:id` - Update a board (protected)
- `DELETE /api/boards/:id` - Delete a board (protected)
- `POST /api/boards/:id/members` - Add member to board (protected)
- `DELETE /api/boards/:id/members/:userId` - Remove member (protected)

### Tasks
- `GET /api/tasks/board/:boardId` - Get all tasks for a board (protected)
- `POST /api/tasks` - Create a task (protected)
- `PUT /api/tasks/:id` - Update a task (protected)
- `DELETE /api/tasks/:id` - Delete a task (protected)

### Comments
- `GET /api/comments/task/:taskId` - Get all comments for a task (protected)
- `POST /api/comments` - Create a comment (protected)
- `PUT /api/comments/:id` - Update a comment (protected)
- `DELETE /api/comments/:id` - Delete a comment (protected)

### Notifications
- `GET /api/notifications` - Get user notifications (protected)
- `PUT /api/notifications/:id/read` - Mark notification as read (protected)
- `DELETE /api/notifications/:id` - Delete notification (protected)

### Uploads
- `POST /api/uploads` - Upload a file (protected)

### Health Check
- `GET /api/health` - Check API and database status

## 🔐 Authentication

Protected routes require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## 📝 Example API Calls

### Register User
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@taskflow.com",
    "password": "admin123",
    "name": "Admin User",
    "code": "123456"
  }'
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@taskflow.com",
    "password": "admin123"
  }'
```

### Create Board (with token)
```bash
curl -X POST http://localhost:5000/api/boards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "My Project",
    "description": "Project board",
    "isPublic": false
  }'
```

## 🛠️ Development

- The server uses `nodemon` for auto-reload in development mode
- All routes are prefixed with `/api`
- CORS is enabled for frontend communication
- Error handling middleware is included
- Database tables are automatically created/updated using Sequelize migrations

## 📚 Project Structure

```
server/
├── config/
│   ├── database.js       # Database connection wrapper
│   ├── mysql.js          # MySQL/Sequelize configuration
│   └── env.js            # Environment configuration
├── middleware/
│   └── auth.js           # JWT authentication middleware
├── models/
│   ├── index.js          # Model relationships
│   ├── User.js           # User model (Sequelize)
│   ├── Board.js          # Board model (Sequelize)
│   ├── Task.js           # Task model (Sequelize)
│   ├── Comment.js        # Comment model (Sequelize)
│   ├── Notification.js   # Notification model (Sequelize)
│   └── EmailVerification.js # Email verification model
├── routes/
│   ├── auth.js           # Authentication routes
│   ├── boards.js         # Board routes
│   ├── tasks.js          # Task routes
│   ├── comments.js       # Comment routes
│   ├── notifications.js  # Notification routes
│   ├── invites.js        # Invite routes
│   └── uploads.js        # File upload routes
├── utils/
│   └── email.js          # Email utilities
├── uploads/              # Uploaded files directory
├── .env                  # Environment variables
├── server.js             # Main server file
└── package.json          # Dependencies
```

## 🔧 Troubleshooting

### MySQL Connection Issues

1. **Check if MySQL is running:**
   ```bash
   # Windows
   net start MySQL80
   
   # Mac
   brew services list
   
   # Linux
   sudo systemctl status mysql
   ```

2. **Verify connection credentials in `.env`**
   - Make sure DB_USER and DB_PASSWORD are correct
   - Ensure the database exists: `CREATE DATABASE taskflow_local;`

3. **Check MySQL logs for errors**
   ```bash
   # Mac
   tail -f /usr/local/var/mysql/*.err
   
   # Linux
   sudo tail -f /var/log/mysql/error.log
   ```

### Port Already in Use

Change the `PORT` in `.env` file to a different port (e.g., 5001)

### CORS Issues

Make sure `CORS_ORIGIN` in `.env` matches your frontend URL. You can specify multiple origins separated by commas.

### Database Schema Issues

If you need to reset the database:
```sql
DROP DATABASE taskflow_local;
CREATE DATABASE taskflow_local;
```
Then restart the server - Sequelize will recreate all tables.

### Email Verification Not Working

1. **For Gmail:** You need to use an App Password, not your regular password
   - Go to Google Account → Security → 2-Step Verification → App Passwords
   - Generate a new app password for "Mail"
   - Use this password in `EMAIL_PASSWORD`

2. **Check server logs** for email sending errors

## 🚀 Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Use a strong `JWT_SECRET`
3. Configure your production database credentials
4. Set up proper CORS origins
5. Use environment variables for all sensitive data
6. Consider using a process manager like PM2

## 📖 Database Schema

The application uses the following tables:
- **users** - User accounts and authentication
- **boards** - Project boards
- **tasks** - Tasks within boards
- **comments** - Comments on tasks
- **notifications** - User notifications
- **emailverifications** - Email verification codes

All relationships are managed by Sequelize ORM with proper foreign keys and cascading deletes.
