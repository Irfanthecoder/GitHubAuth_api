const mysql = require("mysql2");

const connection = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "0000",
    port: 3306,
    database: "github",
    connectionLimit: 20
});

module.exports = {mysql, connection};