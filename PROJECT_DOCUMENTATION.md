# TaskFlow - Project Documentation

**A Real-Time Collaborative Task Management System**

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Database Schema](#database-schema)
6. [API Documentation](#api-documentation)
7. [Security Features](#security-features)
8. [Installation & Setup](#installation--setup)
9. [Screenshots & Demonstrations](#screenshots--demonstrations)
10. [Future Enhancements](#future-enhancements)

---

## Project Overview

### Introduction

**TaskFlow** is a modern, real-time collaborative task management application designed to help teams organize, track, and manage their projects efficiently. Built with cutting-edge web technologies, TaskFlow provides an intuitive drag-and-drop interface for managing tasks across multiple boards, similar to popular tools like Trello and Asana.

### Problem Statement

In today's fast-paced work environment, teams struggle with:
- **Scattered task information** across multiple platforms
- **Lack of real-time collaboration** leading to miscommunication
- **Complex interfaces** that hinder productivity
- **Limited visibility** into project progress
- **Inefficient task tracking** and assignment processes

### Solution

TaskFlow addresses these challenges by providing:
- **Centralized task management** with organized boards
- **Real-time synchronization** across all team members
- **Intuitive drag-and-drop interface** for easy task management
- **Comprehensive notification system** for staying updated
- **Flexible access control** with public and private boards
- **Seamless authentication** with email and Google OAuth

---

## Features

### 1. User Authentication & Authorization

#### Email/Password Authentication
- Secure user registration with email verification
- 6-digit verification code sent via email
- Password hashing using bcrypt (10 rounds)
- JWT-based session management

#### Google OAuth 2.0 Integration
- One-click Google sign-in
- Automatic account creation for new users
- Secure token exchange and validation

#### Role-Based Access Control
- **Admin Role**: First registered user becomes admin
- **User Role**: Standard team members
- Board-level permissions (owner, member)

### 2. Board Management

#### Board Creation & Organization
- Create unlimited boards for different projects
- Rich text descriptions with formatting
- Custom column configuration (To Do, In Progress, Done, etc.)
- Color-coded labels for visual organization

#### Access Control
- **Public Boards**: Visible to all users in the community
- **Private Boards**: Restricted to owner and invited members
- Member invitation system via email
- Pending invitation management

#### Board Operations
- Update board details and settings
- Delete boards with cascade deletion of tasks
- View board statistics (task counts, members)
- Community board discovery

### 3. Task Management

#### Task Creation & Editing
- Rich text task descriptions with TipTap editor
- Priority levels (Low, Medium, High, Critical)
- Due date scheduling with calendar picker
- Custom labels and tags
- File attachments support

#### Drag-and-Drop Interface
- Intuitive task movement between columns
- Real-time position updates
- Smooth animations with @hello-pangea/dnd
- Automatic status updates on column change

#### Task Details
- Comprehensive task detail modal
- Comment threads for discussions
- Activity history tracking
- Assignee management

### 4. Real-Time Collaboration

#### Socket.io Integration
- Instant task updates across all connected clients
- Real-time board synchronization
- Live notification delivery
- Presence indicators for active users

#### Collaborative Features
- Multiple users can work on the same board simultaneously
- Instant visibility of changes made by team members
- Conflict-free concurrent editing
- Real-time comment updates

### 5. Notification System

#### Notification Types
- **Board Created**: When you create a new board
- **Task Created**: When tasks are added to your boards
- **Task Updated**: When task status or details change
- **Task Assigned**: When you're assigned to a task
- **Comment Added**: When someone comments on your tasks
- **Member Invited**: When you're invited to a board

#### Notification Management
- Real-time notification bell with unread count
- Mark individual notifications as read
- Delete notifications
- Notification history

### 6. Comment System

#### Threaded Comments
- Add comments to tasks for discussions
- Rich text formatting support
- Nested replies (parent-child relationships)
- Edit and delete your own comments

#### Real-Time Updates
- Instant comment delivery to all board members
- Live comment count updates
- Notification triggers for new comments

### 7. File Upload

#### Attachment Support
- Upload files to tasks
- Support for images, documents, and more
- Secure file storage with Multer
- File preview capabilities

---

## Technology Stack

### Frontend Technologies

#### Core Framework
- **React 18.3.1**: Modern UI library with hooks and concurrent features
- **TypeScript**: Type-safe development for better code quality
- **Vite**: Lightning-fast build tool and dev server

#### UI Components & Styling
- **shadcn/ui**: High-quality, accessible component library
- **Radix UI**: Unstyled, accessible component primitives
- **TailwindCSS 3.4**: Utility-first CSS framework
- **Lucide React**: Beautiful, consistent icon set

#### State Management & Data Fetching
- **Zustand 5.0**: Lightweight state management
- **TanStack Query 5.83**: Powerful async state management
- **Axios 1.13**: Promise-based HTTP client

#### Rich Text Editing
- **TipTap 3.18**: Headless rich text editor
- **TipTap Extensions**: Image, Link, Mention, Placeholder support

#### Drag and Drop
- **@hello-pangea/dnd 18.0**: Beautiful drag-and-drop for lists

#### Real-Time Communication
- **Socket.io Client 4.8**: WebSocket-based real-time communication

#### Form Handling & Validation
- **React Hook Form 7.61**: Performant form management
- **Zod 3.25**: TypeScript-first schema validation
- **@hookform/resolvers**: Form validation resolvers

#### Routing
- **React Router DOM 7.11**: Declarative routing for React

#### Date Handling
- **date-fns 3.6**: Modern date utility library
- **react-day-picker 8.10**: Flexible date picker component

#### UI Enhancements
- **Sonner**: Beautiful toast notifications
- **next-themes**: Dark mode support
- **Recharts**: Charting library for data visualization

### Backend Technologies

#### Server Framework
- **Node.js**: JavaScript runtime environment
- **Express.js 4.18**: Fast, minimalist web framework

#### Database
- **MySQL 8.0+**: Relational database management system
- **Sequelize 6.37**: Promise-based ORM for Node.js
- **mysql2 3.16**: MySQL client for Node.js

#### Authentication & Security
- **jsonwebtoken 9.0**: JWT token generation and verification
- **bcryptjs 2.4**: Password hashing library
- **google-auth-library 9.0**: Google OAuth 2.0 authentication

#### Real-Time Communication
- **Socket.io 4.8**: Real-time bidirectional event-based communication

#### File Upload
- **Multer 2.0**: Middleware for handling multipart/form-data

#### Email Service
- **Nodemailer 6.10**: Email sending library

#### Utilities
- **dotenv 16.3**: Environment variable management
- **cors 2.8**: Cross-Origin Resource Sharing middleware

#### Development Tools
- **nodemon 3.0**: Auto-restart server on file changes

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │   React    │  │  Zustand   │  │  Socket.io │            │
│  │   + Vite   │  │   Store    │  │   Client   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                    HTTP / WebSocket
                            │
┌─────────────────────────────────────────────────────────────┐
│                       SERVER LAYER                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Express   │  │    JWT     │  │  Socket.io │            │
│  │   Router   │  │    Auth    │  │   Server   │            │
│  └────────────┘  └────────────┘  └────────────┘            │
│                                                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐            │
│  │  Multer    │  │ Nodemailer │  │   Google   │            │
│  │  Upload    │  │   Email    │  │   OAuth    │            │
│  └────────────┘  └────────────┘  └────────────┘            │
└─────────────────────────────────────────────────────────────┘
                            │
                      Sequelize ORM
                            │
┌─────────────────────────────────────────────────────────────┐
│                      DATABASE LAYER                          │
│                                                              │
│                    MySQL Database                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Users   │ │  Boards  │ │  Tasks   │ │ Comments │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
│  ┌──────────────────┐ ┌──────────────────────────┐        │
│  │  Notifications   │ │  EmailVerifications      │        │
│  └──────────────────┘ └──────────────────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Request Flow

#### 1. Authentication Flow
```
User → Frontend → POST /api/auth/register
                ↓
        Email Verification Code Sent
                ↓
User → Frontend → POST /api/auth/register (with code)
                ↓
        Backend validates code
                ↓
        User created in database
                ↓
        JWT token generated
                ↓
        Token sent to frontend
                ↓
        Token stored in Zustand
```

#### 2. Real-Time Task Update Flow
```
User A → Drag task to new column
        ↓
Frontend → PUT /api/tasks/:id (HTTP)
        ↓
Backend → Update database
        ↓
Backend → Emit 'task_updated' (Socket.io)
        ↓
All connected clients receive update
        ↓
User B's UI updates automatically
```

#### 3. Google OAuth Flow
```
User → Click "Sign in with Google"
     ↓
Frontend → Redirect to Google OAuth
     ↓
Google → User authorizes
     ↓
Google → Redirect to /api/auth/google/callback
     ↓
Backend → Verify token with Google
     ↓
Backend → Create/find user in database
     ↓
Backend → Generate JWT token
     ↓
Frontend → Redirect with token
     ↓
User authenticated
```

### Component Architecture

#### Frontend Components Structure
```
src/
├── components/
│   ├── ui/              # Reusable UI components (shadcn/ui)
│   ├── board/           # Board-specific components
│   │   ├── BoardDetailModal.tsx
│   │   ├── TaskCard.tsx
│   │   └── TaskDetailModal.tsx
│   ├── settings/        # Settings components
│   └── layout/          # Layout components
├── pages/               # Page components
│   ├── Dashboard.tsx
│   ├── BoardView.tsx
│   ├── Login.tsx
│   └── Register.tsx
├── contexts/            # React contexts
│   ├── AuthContext.tsx
│   └── SocketContext.tsx
├── store/               # Zustand stores
├── api/                 # API client functions
└── hooks/               # Custom React hooks
```

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────────┐
│     Users       │
├─────────────────┤
│ id (PK)         │
│ email (UNIQUE)  │
│ password        │
│ name            │
│ role            │
│ googleId        │
│ provider        │
│ avatar          │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
        │
        │ 1:N (owner)
        ↓
┌─────────────────┐
│     Boards      │
├─────────────────┤
│ id (PK)         │
│ name            │
│ description     │
│ ownerId (FK)    │
│ isPublic        │
│ columns (JSON)  │
│ members (JSON)  │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
        │
        │ 1:N
        ↓
┌─────────────────┐
│     Tasks       │
├─────────────────┤
│ id (PK)         │
│ title           │
│ description     │
│ status          │
│ priority        │
│ dueDate         │
│ labels (JSON)   │
│ position        │
│ boardId (FK)    │
│ userId (FK)     │
│ createdAt       │
│ updatedAt       │
└─────────────────┘
        │
        │ 1:N
        ↓
┌─────────────────┐
│    Comments     │
├─────────────────┤
│ id (PK)         │
│ content         │
│ taskId (FK)     │
│ userId (FK)     │
│ parentId (FK)   │
│ createdAt       │
│ updatedAt       │
└─────────────────┘

┌─────────────────┐
│ Notifications   │
├─────────────────┤
│ id (PK)         │
│ userId (FK)     │
│ message         │
│ type            │
│ isRead          │
│ boardId (FK)    │
│ taskId (FK)     │
│ createdAt       │
│ updatedAt       │
└─────────────────┘

┌──────────────────────┐
│ EmailVerifications   │
├──────────────────────┤
│ id (PK)              │
│ email                │
│ code                 │
│ expiresAt            │
│ createdAt            │
│ updatedAt            │
└──────────────────────┘
```

### Table Descriptions

#### Users Table
Stores user account information and authentication data.

**Fields:**
- `id`: Auto-incrementing primary key
- `email`: Unique email address
- `password`: Hashed password (nullable for OAuth users)
- `name`: User's display name
- `role`: User role (admin/user)
- `googleId`: Google OAuth ID (nullable)
- `provider`: Authentication provider (local/google)
- `avatar`: Profile picture URL
- `createdAt`, `updatedAt`: Timestamps

#### Boards Table
Stores project boards and their configurations.

**Fields:**
- `id`: Auto-incrementing primary key
- `name`: Board name
- `description`: Board description (TEXT)
- `ownerId`: Foreign key to Users table
- `isPublic`: Boolean for public/private access
- `columns`: JSON array of column definitions
- `members`: JSON array of member objects with roles
- `createdAt`, `updatedAt`: Timestamps

**Relationships:**
- Belongs to User (owner)
- Has many Tasks (cascade delete)
- Has many Notifications (cascade delete)

#### Tasks Table
Stores individual tasks within boards.

**Fields:**
- `id`: Auto-incrementing primary key
- `title`: Task title
- `description`: Task description (TEXT)
- `status`: Current column/status
- `priority`: Priority level (low/medium/high/critical)
- `dueDate`: Due date (nullable)
- `labels`: JSON array of label objects
- `position`: Position within column (for ordering)
- `boardId`: Foreign key to Boards table
- `userId`: Foreign key to Users table (creator)
- `createdAt`, `updatedAt`: Timestamps

**Relationships:**
- Belongs to Board
- Belongs to User (creator)
- Has many Comments (cascade delete)
- Has many Notifications (cascade delete)

#### Comments Table
Stores comments on tasks with support for nested replies.

**Fields:**
- `id`: Auto-incrementing primary key
- `content`: Comment text (TEXT)
- `taskId`: Foreign key to Tasks table
- `userId`: Foreign key to Users table
- `parentId`: Foreign key to Comments table (for nested replies)
- `createdAt`, `updatedAt`: Timestamps

**Relationships:**
- Belongs to Task
- Belongs to User
- Belongs to Comment (parent, nullable)
- Has many Comments (replies, cascade delete)

#### Notifications Table
Stores user notifications for various events.

**Fields:**
- `id`: Auto-incrementing primary key
- `userId`: Foreign key to Users table
- `message`: Notification message
- `type`: Notification type (board_created, task_created, etc.)
- `isRead`: Boolean read status
- `boardId`: Foreign key to Boards table (nullable)
- `taskId`: Foreign key to Tasks table (nullable)
- `createdAt`, `updatedAt`: Timestamps

**Relationships:**
- Belongs to User
- Belongs to Board (nullable)
- Belongs to Task (nullable)

#### EmailVerifications Table
Stores temporary verification codes for email verification.

**Fields:**
- `id`: Auto-incrementing primary key
- `email`: Email address to verify
- `code`: 6-digit verification code
- `expiresAt`: Expiration timestamp (10 minutes)
- `createdAt`, `updatedAt`: Timestamps

---

## API Documentation

### Base URL
```
Development: http://localhost:5000/api
Production: https://your-domain.com/api
```

### Authentication Endpoints

#### POST /auth/send-code
Send verification code to email for registration.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Verification code sent to email"
}
```

#### POST /auth/register
Register a new user with verification code.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe",
  "code": "123456"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /auth/login
Login with email and password.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "avatar": "https://...",
  "provider": "local",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### GET /auth/me
Get current authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "id": 1,
  "email": "user@example.com",
  "name": "John Doe",
  "role": "user",
  "avatar": "https://..."
}
```

### Board Endpoints

#### GET /boards
Get all boards for authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "My Project",
    "description": "Project description",
    "ownerId": 1,
    "isPublic": false,
    "columns": ["To Do", "In Progress", "Done"],
    "members": [],
    "taskCount": 5,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /boards
Create a new board.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "New Project",
  "description": "Project description",
  "isPublic": false,
  "columns": ["To Do", "In Progress", "Done"]
}
```

**Response:**
```json
{
  "id": 2,
  "name": "New Project",
  "description": "Project description",
  "ownerId": 1,
  "isPublic": false,
  "columns": ["To Do", "In Progress", "Done"],
  "members": [],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /boards/:id
Update a board.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "name": "Updated Project Name",
  "description": "Updated description",
  "isPublic": true
}
```

#### DELETE /boards/:id
Delete a board and all its tasks.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Board deleted successfully"
}
```

### Task Endpoints

#### GET /tasks/board/:boardId
Get all tasks for a specific board.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Task Title",
    "description": "Task description",
    "status": "To Do",
    "priority": "high",
    "dueDate": "2024-12-31",
    "labels": [{"name": "Bug", "color": "#ff0000"}],
    "position": 0,
    "boardId": 1,
    "userId": 1,
    "commentCount": 3,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /tasks
Create a new task.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "New Task",
  "description": "Task description",
  "status": "To Do",
  "priority": "medium",
  "dueDate": "2024-12-31",
  "labels": [{"name": "Feature", "color": "#00ff00"}],
  "boardId": 1
}
```

#### PUT /tasks/:id
Update a task.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "title": "Updated Task",
  "status": "In Progress",
  "priority": "high"
}
```

#### DELETE /tasks/:id
Delete a task.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Task deleted successfully"
}
```

### Comment Endpoints

#### GET /comments/task/:taskId
Get all comments for a task.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "content": "This is a comment",
    "taskId": 1,
    "userId": 1,
    "parentId": null,
    "user": {
      "name": "John Doe",
      "avatar": "https://..."
    },
    "replies": [],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### POST /comments
Create a new comment.

**Headers:**
```
Authorization: Bearer <token>
```

**Request Body:**
```json
{
  "content": "This is a comment",
  "taskId": 1,
  "parentId": null
}
```

### Notification Endpoints

#### GET /notifications
Get all notifications for authenticated user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
[
  {
    "id": 1,
    "userId": 1,
    "message": "New task created: Task Title",
    "type": "task_created",
    "isRead": false,
    "boardId": 1,
    "taskId": 1,
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
]
```

#### PUT /notifications/:id/read
Mark notification as read.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "message": "Notification marked as read"
}
```

---

## Security Features

### 1. Password Security
- **Bcrypt Hashing**: All passwords hashed with 10 salt rounds
- **No Plain Text Storage**: Passwords never stored in plain text
- **Password Validation**: Minimum 6 characters required

### 2. JWT Authentication
- **Secure Token Generation**: Using jsonwebtoken library
- **Token Expiration**: Tokens expire after 30 days
- **HTTP-Only Cookies**: Option for secure cookie storage
- **Bearer Token**: Standard Authorization header format

### 3. Input Validation
- **Email Validation**: Proper email format checking
- **SQL Injection Prevention**: Sequelize ORM parameterized queries
- **XSS Protection**: Input sanitization on frontend and backend

### 4. CORS Configuration
- **Whitelist Origins**: Only allowed origins can access API
- **Credentials Support**: Secure cookie handling
- **Preflight Requests**: Proper OPTIONS handling

### 5. Rate Limiting
- **API Rate Limiting**: Prevent abuse (can be implemented)
- **Login Attempt Limiting**: Prevent brute force attacks (can be implemented)

### 6. Environment Variables
- **Sensitive Data**: All secrets stored in .env files
- **Not Committed**: .env files in .gitignore
- **Production Secrets**: Different secrets for production

### 7. Database Security
- **Foreign Key Constraints**: Data integrity enforcement
- **Cascade Deletes**: Proper cleanup of related data
- **Unique Constraints**: Prevent duplicate entries
- **Indexed Fields**: Performance and security

---

## Installation & Setup

### Prerequisites

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/

2. **MySQL** (v8.0 or higher)
   - Windows: https://dev.mysql.com/downloads/installer/
   - Mac: `brew install mysql`
   - Linux: `sudo apt-get install mysql-server`

3. **Git** (for cloning the repository)
   - Download from: https://git-scm.com/

### Backend Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd taskflow-main
   ```

2. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

3. **Create MySQL database:**
   ```bash
   mysql -u root -p
   ```
   In MySQL shell:
   ```sql
   CREATE DATABASE taskflow_local;
   EXIT;
   ```

4. **Configure environment variables:**
   
   Create `server/.env` file:
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

   # JWT Secret
   JWT_SECRET=your-super-secret-jwt-key-change-this

   # CORS Configuration
   CORS_ORIGIN=http://localhost:8080,http://localhost:5173

   # Frontend URL
   FRONTEND_URL=http://localhost:8080

   # Google OAuth (Optional)
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

   # Email Configuration (Optional)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASSWORD=your_app_password
   ```

5. **Start the backend server:**
   ```bash
   npm run dev
   ```
   
   The server will start on http://localhost:5000

### Frontend Setup

1. **Install frontend dependencies:**
   ```bash
   cd ..  # Back to root directory
   npm install
   ```

2. **Configure environment variables:**
   
   Create `.env` file in root:
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_SOCKET_URL=http://localhost:5000
   ```

3. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   
   The application will open at http://localhost:5173

### Verification

1. Open http://localhost:5173 in your browser
2. Register a new account (first user becomes admin)
3. Create a board
4. Add tasks and test drag-and-drop
5. Test real-time updates by opening in multiple browser tabs

---

## Screenshots & Demonstrations

### Key Features to Demonstrate

1. **User Registration & Login**
   - Email verification flow
   - Google OAuth login
   - JWT token authentication

2. **Dashboard**
   - Board overview
   - Quick access to boards
   - Community boards section

3. **Board Management**
   - Create new boards
   - Configure columns
   - Invite members
   - Public/private settings

4. **Task Management**
   - Drag-and-drop functionality
   - Task detail modal
   - Priority and labels
   - Due date scheduling

5. **Real-Time Collaboration**
   - Multiple users on same board
   - Instant task updates
   - Live notifications

6. **Comments & Discussions**
   - Add comments to tasks
   - Nested replies
   - Real-time comment updates

---

## Future Enhancements

### Planned Features

1. **Advanced Task Features**
   - Task dependencies and relationships
   - Recurring tasks
   - Task templates
   - Subtasks and checklists

2. **Enhanced Collaboration**
   - @mentions in comments
   - Task assignments with notifications
   - Activity feed per board
   - User presence indicators

3. **Reporting & Analytics**
   - Task completion statistics
   - Burndown charts
   - Time tracking
   - Export reports (PDF, CSV)

4. **Mobile Application**
   - React Native mobile app
   - Push notifications
   - Offline support

5. **Integration Features**
   - Slack integration
   - Email notifications
   - Calendar sync (Google Calendar, Outlook)
   - GitHub integration

6. **Performance Optimizations**
   - Redis caching
   - Database query optimization
   - CDN for static assets
   - Image optimization

7. **Advanced Security**
   - Two-factor authentication (2FA)
   - Session management
   - Audit logs
   - IP whitelisting

8. **Customization**
   - Custom themes
   - Board templates
   - Custom fields for tasks
   - Workflow automation

---

## Conclusion

TaskFlow represents a modern approach to task management, combining real-time collaboration with an intuitive user interface. Built with industry-standard technologies and best practices, it demonstrates proficiency in:

- **Full-stack development** with React and Node.js
- **Database design** with MySQL and Sequelize ORM
- **Real-time communication** using WebSockets
- **Authentication & security** implementation
- **RESTful API** design and development
- **Modern UI/UX** principles

The application is production-ready and scalable, with a solid foundation for future enhancements and enterprise-level features.

---

**Project By:** [Your Name]  
**Academic Year:** [Year]  
**Institution:** [Your Institution]  
**Contact:** [Your Email]

---

*This documentation is intended for academic presentation and evaluation purposes.*
