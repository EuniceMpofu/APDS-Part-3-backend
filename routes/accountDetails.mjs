import express from 'express';
import db from '../db/conn.mjs';
import {ObjectId} from 'mongodb';
import checkauth from '../check-auth.mjs';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Create a new record
router.post('/accDetails', [
    body('accName')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Account name is required'),
    body('accNumber')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Account number is required'),
    body('swiftCode')
        .trim()
        .escape()
        .notEmpty()
        .withMessage('Swift code is required'),
], checkauth, async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    let newDocument = {
        accName: req.body.accName,
        accNumber: req.body.accNumber,
        swiftCode: req.body.swiftCode
    };

    let collection = await db.collection('accountDetails');
    let result = await collection.insertOne(newDocument);
    res.send(result).status(204);
});

// Retrieve all records
router.get('/', async (req, res) => {
    let collection = await db.collection('accountDetails');
    let results = await collection.find({}).toArray();
    res.send(results).status(200);
});

export default router;