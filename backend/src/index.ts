import app from './app';
import { initDb } from './db';
import { seedDatabase } from './scripts/seedData';
import { startSensorSimulator } from './services/simulator.service';
import { runScoringJob } from './services/scoring.service';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 3001;
const SIMULATOR_INTERVAL_MS = Number(process.env.SIMULATOR_INTERVAL_MS) || 10000;
const SCORING_INTERVAL_MS = Number(process.env.SCORING_INTERVAL_MS) || 30000;

let scoringTimer: NodeJS.Timeout | null = null;

async function bootstrap() {
  try {
    console.log('Initializing database connection...');
    await initDb();

    // Auto-seed if empty
    await seedDatabase(false);

    // Run initial scoring job
    await runScoringJob();

    // Start background IoT sensor simulator
    await startSensorSimulator(SIMULATOR_INTERVAL_MS);

    // Start scheduled hotspot scoring job
    console.log(`Starting scheduled Hotspot Scoring Job (Interval: ${SCORING_INTERVAL_MS}ms)...`);
    scoringTimer = setInterval(() => {
      runScoringJob().catch(err => console.error('Scheduled scoring error:', err));
    }, SCORING_INTERVAL_MS);

    app.listen(PORT, () => {
      console.log(`\n========================================================================`);
      console.log(`🚀 Vayu Vigil Backend API running on port ${PORT} 🚀`);
      console.log(`Health Check: http://localhost:${PORT}/api/v1/health`);
      console.log(`Demo Seed Accounts:`);
      console.log(`  • Officer Ward 1 (Bhalswa): officer.ward1@vayuvigil.gov / admin123`);
      console.log(`  • Officer Ward 2 (Sector 9): officer.ward2@vayuvigil.gov / admin123`);
      console.log(`  • Admin (All Wards):         admin@vayuvigil.gov / admin123`);
      console.log(`  • Analyst (Read-Only):       analyst@vayuvigil.gov / admin123`);
      console.log(`  • Citizen Phone OTP Demo:    +919876543210 / OTP: 123456`);
      console.log(`========================================================================\n`);
    });
  } catch (err) {
    console.error('Fatal error starting server:', err);
    process.exit(1);
  }
}

bootstrap();
