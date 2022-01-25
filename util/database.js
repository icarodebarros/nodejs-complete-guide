const mysql = require('mysql2');

const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'node-complete-guide',
    password: ''
});

module.exports = pool.promise();