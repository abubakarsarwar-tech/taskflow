import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: 'users',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    type: {
        type: DataTypes.ENUM(
            'board_created',
            'task_created',
            'task_deadline',
            'board_invite',
            'task_moved',
            'task_deleted',
            'added_to_board',
            'member_removed',
            'member_left',
            'comment_added',
            'role_changed',
            'mention'
        ),
        allowNull: false
    },
    boardId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'boards',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    taskId: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
            model: 'tasks',
            key: 'id'
        },
        onDelete: 'CASCADE'
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        { fields: ['userId', 'createdAt'] },
        { fields: ['read'] }
    ]
});

export default Notification;
