import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const Board = sequelize.define('Board', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: ''
  },
  isPublic: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  members: {
    type: DataTypes.JSON,
    defaultValue: [],
    get() {
      const rawValue = this.getDataValue('members');
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
  columns: {
    type: DataTypes.JSON,
    defaultValue: [
      { id: 'todo', title: 'To Do', taskIds: [], position: 0 },
      { id: 'in-progress', title: 'In Progress', taskIds: [], position: 1 },
      { id: 'done', title: 'Done', taskIds: [], position: 2 }
    ],
    get() {
      const rawValue = this.getDataValue('columns');
      if (typeof rawValue === 'string') {
        try {
          return JSON.parse(rawValue);
        } catch (e) {
          return [];
        }
      }
      return rawValue || [];
    }
  }
}, {
  tableName: 'boards',
  timestamps: true,
  indexes: [
    { fields: ['ownerId'] },
    { fields: ['isPublic', 'createdAt'] }
  ]
});

export default Board;