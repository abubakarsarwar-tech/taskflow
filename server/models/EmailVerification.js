import { DataTypes } from 'sequelize';
import { sequelize } from '../config/mysql.js';

const EmailVerification = sequelize.define('EmailVerification', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        validate: {
            isEmail: true
        }
    },
    code: {
        type: DataTypes.STRING(10),
        allowNull: false
    },
    expiresAt: {
        type: DataTypes.DATE,
        allowNull: false
    }
}, {
    tableName: 'email_verifications',
    timestamps: true,
    updatedAt: false,
    indexes: [
        { fields: ['email'] },
        { fields: ['code'] },
        { fields: ['expiresAt'] }
    ]
});

export default EmailVerification;
