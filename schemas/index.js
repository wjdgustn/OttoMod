
const mongoose = require('mongoose');
const fs = require('fs');

const setting = require('../setting.json');

module.exports = () => {
    const connect = () => {
        mongoose.connect(`mongodb://${setting.MONGODB_USER}:${setting.MONGODB_PASSWORD}@${setting.MONGODB_HOST}:${setting.MONGODB_PORT}/admin`, {
            dbName: setting.DBNAME
        }, e => {
            if(e) console.error(e);
            else console.log(`MongoDB connected.`);
        });
    }
    connect();
    mongoose.connection.on('error', e => {
        console.error(e);
    });
    mongoose.connection.on('disconnected', () => {
        console.error('MongoDB disconnected. reconnecting...');
        connect();
    });

    console.log('Loading schemas...');
    fs.readdirSync('./schemas').forEach(file => {
        if(file !== 'index.js') {
            require(`./${file}`);
            console.log(`${file.trim()} schema loaded.`);
        }
    });
    console.log('All schemas loaded.');
}