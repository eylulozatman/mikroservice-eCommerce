const { Sequelize } = require('sequelize');
require('dotenv').config();

const sequelize = new Sequelize(
    process.env.DB_NAME || 'order_db',
    process.env.DB_USER || 'postgres',
    process.env.DB_PASSWORD || 'postgres',
    {
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        dialect: 'postgres',
        logging: process.env.NODE_ENV === 'development' ? console.log : false,
        pool: {
            max: 10,
            min: 0,
            acquire: 30000,
            idle: 10000
        },
        define: {
            timestamps: true,
            underscored: true
        }
    }
);

/**
 * Test database connection
 */
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('✅ PostgreSQL connection established successfully.');
        return true;
    } catch (error) {
        console.error('❌ Unable to connect to PostgreSQL:', error.message);
        return false;
    }
};

/**
 * Sync database models
 */
const syncDatabase = async (force = false) => {
    try {
        await sequelize.sync({ force });
        console.log('✅ Database synchronized successfully.');
        return true;
    } catch (error) {
        console.error('❌ Database sync failed:', error.message);
        return false;
    }
};

module.exports = {
    sequelize,
    testConnection,
    syncDatabase
};
