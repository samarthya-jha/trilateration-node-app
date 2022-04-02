const mysql = require("mysql2");

const pool = mysql.createPool({
  host: '52.221.16.79',
  port: '3306',
  user: 'hornbird_user',
  database: 'hornbird',
  password: '2vILBfqiBr_trai',
  connectionLimit: 100
})

pool.getConnection((err) => {
  if(!err) {
    console.log("MySQL connected");
  } else {
    console.log(err.message);
  }
})

module.exports = pool.promise();

