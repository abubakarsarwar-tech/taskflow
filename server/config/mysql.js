import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

// Database configuration
const sequelize = new Sequelize(
    process.env.DB_NAME || 'taskflow',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        dialect: 'mysql',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 2,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: false,
            freezeTableName: true
        }
    }
);

// Test connection
const connectDB = async (retryCount = 0, maxRetries = 3) => {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL Connected:', process.env.DB_HOST || 'localhost');
        console.log('📊 Database:', process.env.DB_NAME || 'taskflow');

        // Sync models (creates tables if they don't exist)
        // In production, we use alter: true one-time to ensure schema is correct
        await sequelize.sync({ alter: true });
        console.log('✅ Database synchronized');

        return sequelize;
    } catch (error) {
        console.error(`❌ Error connecting to MySQL (attempt ${retryCount + 1}/${maxRetries + 1}):`, error.message);

        if (retryCount < maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
            console.log(`🔄 Retrying connection in ${delay / 1000}s...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            return connectDB(retryCount + 1, maxRetries);
        }

        console.error('💡 Connection troubleshooting:');
        console.error('   1. Verify MySQL server is running');
        console.error('   2. Check DB credentials in .env file');
        console.error('   3. Ensure database exists: CREATE DATABASE taskflow;');
        console.error('   4. Verify user has proper permissions');
        console.error('⚠️ Server will continue running, but database operations will fail');

        throw error;
    }
};

export { sequelize, connectDB };
export default connectDB;
