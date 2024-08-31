import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { errorHandler } from './middleware/errorHandler.js';
import { connectDB } from './db/connectDB.js';

import authRoutes from './routes/auth.route.js';

const app = express();
dotenv.config();
app.use(express.json());

app.use(cors({ origin: "http://localhost:5173", credentials: true}));

app.use(cookieParser());

const PORT= process.env.PORT || 3000;


app.use("/api/auth", authRoutes);
app.use(errorHandler);

app.listen(PORT, () => {
    connectDB();
    console.log('Server is running on port 3000');
});