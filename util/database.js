// const mysql = require('mysql2');

// const pool = mysql.createPool({
//     host: 'localhost',
//     user: 'root',
//     database: 'node-complete-guide',
//     password: ''
// });

// module.exports = pool.promise();

const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete-guide', 'root', 'adminroot', {
  dialect: 'mysql',
  host: 'localhost'
});

module.exports = sequelize;