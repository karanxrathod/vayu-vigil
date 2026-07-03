import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.routes';
import reportRoutes from './routes/report.routes';
import sensorRoutes from './routes/sensor.routes';
import hotspotRoutes from './routes/hotspot.routes';
import alertRoutes from './routes/alert.routes';
import analyticsRoutes from './routes/analytics.routes';
import infrastructureRoutes from './routes/infrastructure.routes';

const app: Express = express();

// Security and utility middleware
app.use(helmet({
  crossOriginResourcePolicy: false // allow serving static photos cross-origin
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static serving for uploaded incident photos
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Rate Limiting on critical public submission endpoints (PRD Section 10 requirement)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP, please try again after 15 minutes.' }
});

app.use('/api/v1/reports', apiLimiter);
app.use('/api/v1/sensors/ingest', apiLimiter);

// Mount API routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/sensors', sensorRoutes);
app.use('/api/v1/hotspots', hotspotRoutes);
app.use('/api/v1/alerts', alertRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/infra', infrastructureRoutes);

// Health Check Endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'vayu-vigil-backend-api',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/v1/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'healthy',
    service: 'vayu-vigil-backend-api',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

export default app;
