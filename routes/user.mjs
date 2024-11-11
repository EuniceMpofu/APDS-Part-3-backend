import express from 'express';
import db from '../db/conn.mjs';
import {ObjectId} from 'mongodb';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import ExpressBrute from 'express-brute';
import { body, validationResult } from 'express-validator';
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

var store = new ExpressBrute.MemoryStore();
var bruteforce = new ExpressBrute(store);

// sign-up
router.post('/signup', [ 
    // Password validation
    body('password')
        .isLength({ min: 14 }).withMessage('Password must be at least 14 characters long')
        .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
        .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number')
        .matches(/[!@#\$%\^\&*\)\(+=._-]/)
        .withMessage('Password must contain at least one special character'),
    body('fullname')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Fullname is required'),
    body('accNumber')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Account number is required'),
    body('idNumber')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('ID number is required'),

], async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    // Password hashing
    const password = bcrypt.hash(req.body.password, 10)
    let newDocument = {
        fullname: req.body.fullname,
        idNumber: req.body.idNumber,
        accNumber: req.body.accNumber,
        password: (await password).toString(),
        employee: "n"
    };

    let collection = await db.collection("users");
    let result = await collection.insertOne(newDocument);
    console.log(password);
    res.send(result).status(204);
});

// login
router.post('/login', [
    body('fullname', 'accNumber')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Fullname is required'),
    body('accNumber')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Account number is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
], bruteforce.prevent, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {fullname, accNumber, password} = req.body;

    try {
        const collection = await db.collection('users');
        const user = await collection.findOne({fullname});

        if (!user) {
            return res.status(401).json({message: "Authentication failed"});
        }

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        if (!passwordMatch) {
            return res.status(401).json({message: "Authentication failed"});
        } else {
            // Authentication successful
            const token = jwt.sign(
                { username: req.body.username, accNumber: req.body.accNumber, password: req.body.password },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            // Set the token in a cookie before sending the response
            res.cookie('token', token, {
                httpOnly: true,  
                secure: true,    
                sameSite: 'Strict', 
                maxAge: 3600000, 
            });

            // Send the response after setting the cookie
            res.status(200).json({
                message: "Authentication successful",
                token: token,
                fullname: req.body.fullname
            });

            console.log("Your new token is", token);
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({message: "Login failed"});
    }
});

// login
router.post('/employee-login', [
    body('fullname', 'accNumber')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Fullname is required'),
    body('accNumber')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Account number is required'),
    body('password')
        .notEmpty()
        .withMessage('Password is required'),
], bruteforce.prevent, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const {fullname, accNumber, password} = req.body;

    try {
        const collection = await db.collection('users');
        const user = await collection.findOne({fullname});

        if (!user) {
            return res.status(401).json({message: "Authentication failed"});
        }

        // Compare the provided password with the hashed password in the database
        const passwordMatch = await bcrypt.compare(password, user.password);

        // Check if the user is an employee
        const isEmployee = user.employee === "y";

        if (!passwordMatch || !isEmployee) {
            return res.status(401).json({message: "Authentication failed, make sure you have entered the correct credentials and you are an employee."});
        } else {
            // Authentication successful
            const token = jwt.sign(
                { username: req.body.username, accNumber: req.body.accNumber, password: req.body.password },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );

            // Set the token in a cookie before sending the response
            res.cookie('token', token, {
                httpOnly: true,  
                secure: true,    
                sameSite: 'Strict', 
                maxAge: 3600000, 
            });

            // Send the response after setting the cookie
            res.status(200).json({
                message: "Authentication successful",
                token: token,
                fullname: req.body.fullname
            });

            console.log("Your new token is", token);
        }
    } catch (error) {
        console.error("Login error:", error);
        res.status(500).json({message: "Login failed"});
    }
});

export default router;