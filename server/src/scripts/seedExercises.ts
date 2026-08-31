import 'dotenv/config';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ExerciseModel, type MeasurementUnit } from '../models/Exercise.js';
import { logger } from '../utils/logger.js';

interface SeedExercise {
  name: string;
  category: string;
  measurementUnit: MeasurementUnit;
}

const SEED_EXERCISES: SeedExercise[] = [
  { name: 'לחיצות חזה', category: 'חזה', measurementUnit: 'kg' },
  { name: 'פרפר', category: 'חזה', measurementUnit: 'kg' },
  { name: 'לחיצות כתפיים', category: 'כתפיים', measurementUnit: 'kg' },
  { name: 'פרפר הפוך', category: 'כתפיים', measurementUnit: 'kg' },
  { name: 'פולי עליון רגיל', category: 'גב', measurementUnit: 'kg' },
  { name: 'פולי עליון צר מאוד לחזה', category: 'גב', measurementUnit: 'kg' },
  { name: 'חתירה במכונה', category: 'גב', measurementUnit: 'kg' },
  { name: 'חתירה במכשיר חופשי', category: 'גב', measurementUnit: 'kg' },
  { name: 'מתח במכשיר רחב', category: 'גב', measurementUnit: 'kg' },
  { name: 'מתח במכשיר צר', category: 'גב', measurementUnit: 'kg' },
  { name: 'יד קדמית במכונה', category: 'ידיים', measurementUnit: 'kg' },
  { name: 'יד אחורית בחבל קשיח', category: 'ידיים', measurementUnit: 'hole' },
  { name: 'יד אחורית בחבל גמיש', category: 'ידיים', measurementUnit: 'hole' },
  { name: 'סקוואט במכשיר', category: 'רגליים', measurementUnit: 'kg' },
  { name: 'כפיפת רגליים 3', category: 'רגליים', measurementUnit: 'kg' },
  { name: 'תאומים במכשיר', category: 'רגליים', measurementUnit: 'kg' },
  { name: 'בטן במכונה', category: 'בטן', measurementUnit: 'kg' },
];

async function seed(): Promise<void> {
  await mongoose.connect(env.mongodbUri);

  for (const exercise of SEED_EXERCISES) {
    await ExerciseModel.updateOne(
      { name: exercise.name },
      { $setOnInsert: exercise },
      { upsert: true },
    );
  }

  logger.info(`Seeded ${SEED_EXERCISES.length} exercises`);
  await mongoose.disconnect();
}

seed().catch((error) => {
  logger.error('Seeding failed', { message: (error as Error).message });
  process.exit(1);
});
