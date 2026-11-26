import express from "express";
import helmet from 'helmet';
import cors from 'cors';
import dotenv from 'dotenv';
import { env } from "./config/env";
import transcriptionRoutes from './routes/transcription.routes';

dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '100kb' }));

const port = env.port;

// API routes
app.use('/api', transcriptionRoutes);



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
})