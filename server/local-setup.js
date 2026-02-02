import { Sequelize } from 'sequelize';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

/**
 * This script helps initialize the local database if it doesn't exist
 * and tests the connection.
 */
async function setupLocalDB() {
    const connectionDetails = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        port: parseInt(process.env.DB_PORT || '3306')
    };

    const dbName = process.env.DB_NAME || 'taskflow_local';

    console.log('🔍 Checking local MySQL connection...');
    console.log(`📍 Host: ${connectionDetails.host}`);
    console.log(`📍 User: ${connectionDetails.user}`);
    console.log(`📍 Database: ${dbName}`);

    try {
        // 1. Connect to MySQL without database to create it if it doesn't exist
        const connection = await mysql.createConnection(connectionDetails);
        console.log('✅ Connected to MySQL server.');

        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
        console.log(`✅ Database "${dbName}" ensured/created.`);
        await connection.end();

        // 2. Test with Sequelize to ensure models can sync
        const sequelize = new Sequelize(dbName, connectionDetails.user, connectionDetails.password, {
            host: connectionDetails.host,
            port: connectionDetails.port,
            dialect: 'mysql',
            logging: false
        });

        await sequelize.authenticate();
        console.log('✅ Sequelize authenticated successfully.');

        console.log('\n🚀 Success! You can now run the following commands:');
        console.log('1. cd server && npm run dev (Terminal 1 - Backend)');
        console.log('2. npm run dev (Terminal 2 - Frontend)');

    } catch (error) {
        console.error('\n❌ Local setup failed:');
        if (error.code === 'ECONNREFUSED') {
            console.error('   MySQL is NOT running. Please start XAMPP, MAMP, or your local MySQL service.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('   Access denied. Check your DB_USER and DB_PASSWORD in server/.env.');
        } else {
            console.error('  ', error.message);
        }
        process.exit(1);
    }
}

setupLocalDB();
