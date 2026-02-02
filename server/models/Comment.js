import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const Comment = sequelize.define('Comment', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'tasks',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  parentId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'comments',
      key: 'id'
    },
    onDelete: 'CASCADE'
  },
  userName: {
    type: DataTypes.STRING(255),
    allowNull: true
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  screenshotUrl: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  attachments: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('attachments');
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return [];
        }
      }
      return rawValue || [];
    }
  },
  type: {
    type: DataTypes.ENUM('comment', 'completion'),
    defaultValue: 'comment'
  }
}, {
  tableName: 'comments',
  timestamps: true,
  updatedAt: false, // Only track creation time
  indexes: [
    { fields: ['taskId', 'createdAt'] },
    { fields: ['userId'] },
    { fields: ['parentId'] }
  ]
});

export default Comment;
