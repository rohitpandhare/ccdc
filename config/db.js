var myDB = require('mysql2');

const conPool = myDB.createPool({
    connectionLimit: 1000,
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: "doctorsync_db",
    debug: false,
    waitForConnections: true,
    queueLimit: 0
});


conPool.on('error', (err) => {
    console.error('Database pool error:', err);
});

module.exports = {
    conPool
};
