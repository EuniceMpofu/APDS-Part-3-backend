import https from "https";
import http from "http";
import fs from "fs";
import users from './routes/user.mjs';
import paymentDetails from './routes/paymentDetails.mjs';
import accountDetails from './routes/accountDetails.mjs';
import express from "express";
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

const PORT = 3001;
const app = express();

const options = {
    key: fs.readFileSync('keys/privatekey.pem'),
    cert: fs.readFileSync('keys/certificate.pem')
}

// Rate limiting middleware
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, 
    max: 1000, 
    message: "Too many requests from this IP, please try again after 15 minutes."
});

app.use(cors());
app.use(express.json());
app.use(helmet());
app.use(limiter);
app.use(cookieParser());

app.use((reg,res,next) =>
{
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', '*');
    res.setHeader('Access-Control-Allow-Methods', '*');
    next();
})

app.use('/user', users);
app.route('/user', users);
app.use('/paymentDetails', paymentDetails);
app.route('/paymentDetails', paymentDetails);
app.use('/accountDetails', accountDetails);
app.route('/accountDetails', accountDetails);

let server = https.createServer(options, app);
console.log(PORT)
server.listen(PORT);