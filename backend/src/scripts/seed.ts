import { initDb, closeDb } from '../db';
import { seedDatabase } from './seedData';
import { runScoringJob } from '../services/scoring.service';

async function run() {
  try {
    await initDb();
    await seedDatabase(true); // force reset on explicit npm run seed
    await runScoringJob();
    console.log('Seed command completed successfully.');
  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  } finally {
    await closeDb();
  }
}

run();
