const express = require("express");
const { mysql, connection } = require("./db_connection");
const bodyParser = require("body-parser");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const router = express.Router();
const app = express();
const saltRounds = 10;
const jwtSecret = "merasecret";

app.use(bodyParser.json());

// Function to generate JWT token
const generateToken = (userId) => {
    return jwt.sign({ userId }, jwtSecret, { expiresIn: '1h' });
};

// GET all users
const getUsers = async (req, res, next) => {
    try {
        const { limit, offset } = req.query;

        const queryString = "SELECT id, user_name, email, name, is_active, created_at, updated_at FROM users ORDER BY id ASC LIMIT ? OFFSET ? ;";
        const [results] = await connection.promise().execute(queryString, [limit, offset]);

        const countQueryString = "SELECT COUNT(*) as count FROM users";
        const [countResults] = await connection.promise().execute(countQueryString);

        const responseBody = {
            message: "Users list",
            list: results,
            count: countResults[0].count,
        };
        res.status(200).send(responseBody);

    } catch (err) {
        res.status(500).send({ message: "Internal Server Error" });
    }
};

// Register
const registerUser = async (req, res, next) => {
    try {
        const { email, user_name, password } = req.body;

        if (!email || !user_name || !password) {
            res.status(400).send({
                message: "All fields required",
            });
        }

        const [existingUser] = await connection.promise().execute(
            "SELECT * FROM users WHERE email = ? OR user_name = ?",
            [email, user_name]
        );

        if (existingUser.length > 0) {
            return res.status(409).send({
                message: "User with this email or username already exists",
            });
        }

        let hashedPassword = await bcrypt.hash(password, saltRounds);
        const queryString = `INSERT INTO users (email, user_name, password) VALUES (?, ?, ?);`;

        const [results] = await connection.promise().execute(queryString, [email, user_name, hashedPassword]);

        res.status(201).send({
            message: "User added successfully",
            results,
        });

    } catch (err) {
        console.error(err);
        res.status(400).send({ message: "An error occurred" });
    }
};


// Login
const loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            res.status(400).send({ message: "Enter all fields" });
            return;
        }

        const queryString = `SELECT * FROM users WHERE email = ?`;
        const [result] = await connection.promise().execute(queryString, [email]);

        if (result.length === 0) {
            res.status(404).send({ message: "User not found" });
            return;
        }

        const hashedPassword = result[0].password;
        const passwordMatch = await bcrypt.compare(password, hashedPassword);

        if (!passwordMatch) {
            res.status(400).send({ message: "Invalid credentials" });
            return;
        }

        // Generate JWT token
        const token = generateToken(result[0].id);

        res.status(200).send({
            message: "Login Successful",
            token
        });

    } catch (err) {
        console.error(err);
        res.status(500).send({ message: "An error occurred" });
    }
};


// Forgot Password
const forgotPassword = async (req, res, next) => {
  try {
      const { email } = req.body;

      if (!email) {
          res.status(400).send({ message: "Email is required" });
          return;
      }

      const [result] = await connection.promise().execute("SELECT * FROM users WHERE email = ?", [email]);

      if (result.length === 0) {
          res.status(404).send({ message: "User not found" });
          return;
      }

      const otp = Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit OTP

      await connection.promise().execute("UPDATE users SET otp = ? WHERE email = ?", [otp, email]);

      res.status(200).send({ message: "OTP sent successfully", otp });
  } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Internal Server Error" });
  }
};


// Reset Password
const resetPassword = async (req, res, next) => {
  try {
      const { email, otp, newPassword } = req.body;

      if (!email || !otp || !newPassword) {
          res.status(400).send({ message: "Email, OTP, and new password are required" });
          return;
      }
      const [result] = await connection.promise().execute("SELECT * FROM users WHERE email = ? AND otp = ?", [email, otp]);

      if (result.length === 0) {
          res.status(400).send({ message: "Invalid OTP" });
          return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      await connection.promise().execute("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

      // Clear the OTP from the database after password reset
      await connection.promise().execute("UPDATE users SET otp = NULL WHERE email = ?", [email]);

      res.status(200).send({ message: "Password reset successfully" });
  } catch (err) {
      console.error(err);
      res.status(500).send({ message: "Internal Server Error" });
  }
};

// Users API
router.get("/users", getUsers);
router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router;
