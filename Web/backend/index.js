import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';

import { errorHandler } from './middleware/errorHandler.js';
import { connectDB } from './db/connectDB.js';

import authRoutes from './routes/auth.route.js';

const app = express();
dotenv.config();
app.use(express.json());

app.use(cors({ origin: "http://localhost:5173", credentials: true}));

app.use(cookieParser());

const PORT= process.env.PORT || 3000;
const __direname = path.resolve();


app.use("/api/auth", authRoutes);
app.use(errorHandler);
if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__direname, "/frontend/dist")));
    
    app.get("*", (req, res) => {
        res.sendFile(path.resolve(__direname, "frontend", "dist", "index.html"));
    });
}


app.listen(PORT, () => {
    connectDB();
    console.log('Server is running on port 3000');
});