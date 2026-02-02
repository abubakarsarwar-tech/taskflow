# TaskFlow - Collaborative Project Management System

TaskFlow is a modern, real-time collaborative task management application built for teams. It features a robust Kanban-style interface, real-time notifications, and seamless Google OAuth integration.

## 🚀 Key Features

- **Real-Time Collaboration**: Instant updates across all users using Socket.io.
- **Kanban Boards**: Dynamic drag-and-drop task management.
- **Rich Text Editing**: Enhanced task descriptions with TipTap editor.
- **Authentication**: Secure login via JWT and Google OAuth 2.0.
- **Notifications**: Real-time alerts for invitations and task updates.
- **Community Boards**: Discover and join public project boards.

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 with TypeScript
- **Styling**: Tailwind CSS & shadcn/ui
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Real-time**: Socket.io Client

### Backend
- **Runtime**: Node.js & Express.js
- **Database**: MySQL with Sequelize ORM
- **Security**: JWT & Google OAuth
- **Email**: Nodemailer for invitations

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MySQL (v8.0+)
- Google Cloud Console account (for OAuth)

### Backend Setup
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file based on `.env.example`:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_NAME=taskflow
   DB_USER=root
   DB_PASSWORD=
   JWT_SECRET=your_secret_key
   ```
4. Synchronize the database:
   ```bash
   node sync-db.js
   ```
5. Start the server:
   ```bash
   npm start
   ```

### Frontend Setup
1. Navigate to the root directory.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```

## 📖 Detailed Documentation
For more detailed information regarding the system architecture, database schema, and API endpoints, please refer to [PROJECT_DOCUMENTATION.md](./PROJECT_DOCUMENTATION.md).

---
© 2024 TaskFlow Project Team
