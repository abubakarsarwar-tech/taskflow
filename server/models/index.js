import { sequelize } from '../config/mysql.js';
import User from './User.js';
import Board from './Board.js';
import Task from './Task.js';
import Comment from './Comment.js';
import Notification from './Notification.js';
import EmailVerification from './EmailVerification.js';

// Define relationships
// User has many Boards
User.hasMany(Board, { foreignKey: 'ownerId', as: 'boards', onDelete: 'CASCADE' });
Board.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// User has many Tasks
User.hasMany(Task, { foreignKey: 'userId', as: 'tasks' });
Task.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Board has many Tasks
Board.hasMany(Task, { foreignKey: 'boardId', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });

// Task has many Comments
Task.hasMany(Comment, { foreignKey: 'taskId', as: 'comments', onDelete: 'CASCADE' });
Comment.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

// User has many Comments
User.hasMany(Comment, { foreignKey: 'userId', as: 'comments' });
Comment.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Comment can have parent Comment (nested comments)
Comment.hasMany(Comment, { foreignKey: 'parentId', as: 'replies', onDelete: 'CASCADE' });
Comment.belongsTo(Comment, { foreignKey: 'parentId', as: 'parent' });

// User has many Notifications
User.hasMany(Notification, { foreignKey: 'userId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// Board can have Notifications
Board.hasMany(Notification, { foreignKey: 'boardId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(Board, { foreignKey: 'boardId', as: 'board' });

// Task can have Notifications
Task.hasMany(Notification, { foreignKey: 'taskId', as: 'notifications', onDelete: 'CASCADE' });
Notification.belongsTo(Task, { foreignKey: 'taskId', as: 'task' });

// Export all models and sequelize instance
export {
    sequelize,
    User,
    Board,
    Task,
    Comment,
    Notification,
    EmailVerification
};

// Export default for convenience
export default {
    sequelize,
    User,
    Board,
    Task,
    Comment,
    Notification,
    EmailVerification
};
