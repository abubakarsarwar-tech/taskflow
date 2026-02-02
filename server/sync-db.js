#!/usr/bin/env node

/**
 * Database Sync Script
 * This script synchronizes the database schema with the Sequelize models
 * Run this if you're experiencing database-related errors
 */

import { sequelize } from './config/mysql.js';
import './models/index.js';

async function syncDatabase() {
    try {
        console.log('🔄 Starting database synchronization...');

        // Test connection first
        await sequelize.authenticate();
        console.log('✅ Database connection established');

        // Sync all models (alter: true will update existing tables)
        await sequelize.sync({ alter: true });
        console.log('✅ Database synchronized successfully!');

        // Show all tables
        const [results] = await sequelize.query("SHOW TABLES");
        console.log('\n📊 Database tables:');
        results.forEach(row => {
            console.log(`  - ${Object.values(row)[0]}`);
        });

        console.log('\n✅ Database is ready!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Database sync error:', error.message);
        console.error('\nFull error:', error);
        process.exit(1);
    }
}

syncDatabase();
