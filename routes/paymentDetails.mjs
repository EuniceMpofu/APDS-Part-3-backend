import express from 'express';
import db from '../db/conn.mjs';
import {ObjectId} from 'mongodb';
import checkauth from '../check-auth.mjs';
import { body, validationResult } from 'express-validator';

const router = express.Router();

// Create a new record
router.post('/payDetails', [
    body('amount')
        .isNumeric()
        .notEmpty()
        .withMessage('A numeric value of the amount is required'),
    body('currency')
        .isIn(['USD', 'EUR', 'GBP', 'ZWL', 'ZAR'])
        .notEmpty()
        .withMessage('The currency is required'),
    body('provider')
        .isIn(['SWIFT', 'Wise', 'SEPA'])
        .notEmpty()
        .withMessage('A service provider is required'),
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
    
    // Create a new record in the 'paymentDetails' collection
    let newDocument = {
        amount: req.body.amount,
        currency: req.body.currency,
        provider: req.body.provider,
        accName: req.body.accName,
        accNumber: req.body.accNumber,
        swiftCode: req.body.swiftCode,
        verified: false,
        submitted: false,
    };

    let collection = await db.collection('paymentDetails');
    let result = await collection.insertOne(newDocument);
    res.send(result).status(204);
});

// Retrieve all unverified payment details
router.get('/', async (req, res) => {
    let collection = await db.collection('paymentDetails');
    let results = await collection.find({ submitted: false }).toArray();
    res.send(results).status(200);
});

// Verify a payment detail
router.patch('/payDetails/:id', checkauth, async (req, res) => {
    const query = { _id: new ObjectId(req.params.id) };
    const updates = {};

    if (typeof req.body.verified !== 'undefined') updates.verified = req.body.verified;
    if (typeof req.body.submitted !== 'undefined') updates.submitted = req.body.submitted;

    try {
        const collection = await db.collection('paymentDetails');
        const result = await collection.updateOne(query, { $set: updates });
        res.status(200).json(result);
    } catch (error) {
        res.status(500).send("Error updating transaction");
    }
});

export default router;