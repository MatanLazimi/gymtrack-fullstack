import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { ExerciseModel, type MeasurementUnit } from '../models/Exercise.js';
import { UserModel } from '../models/User.js';
import { WorkoutModel } from '../models/Workout.js';
import { logger } from '../utils/logger.js';

interface WorkoutBackupSet {
  value: number;
  reps: number;
  hasAdditionalWeight: boolean;
  isPerSide: boolean;
}

interface WorkoutBackupExercise {
  exerciseName: string;
  category: string;
  measurementUnit: MeasurementUnit;
  sets: WorkoutBackupSet[];
}

interface WorkoutBackup {
  email: string;
  date: string;
  exercises: WorkoutBackupExercise[];
}

async function restore(filePath: string): Promise<void> {
  const raw = await readFile(filePath, 'utf-8');
  const backup = JSON.parse(raw) as WorkoutBackup;

  await mongoose.connect(env.mongodbUri);

  const user = await UserModel.findOne({ email: backup.email.toLowerCase() });
  if (!user) {
    throw new Error(
      `No account found for ${backup.email} - register that account first, then re-run this script.`,
    );
  }

  const exercises = [];
  for (const backupExercise of backup.exercises) {
    const exercise = await ExerciseModel.findOneAndUpdate(
      { name: backupExercise.exerciseName },
      {
        $setOnInsert: {
          name: backupExercise.exerciseName,
          category: backupExercise.category,
          measurementUnit: backupExercise.measurementUnit,
        },
      },
      { upsert: true, new: true },
    );
    exercises.push({
      exerciseId: exercise._id,
      exerciseName: exercise.name,
      sets: backupExercise.sets,
    });
  }

  const workout = await WorkoutModel.findOneAndUpdate(
    { userId: user._id, date: new Date(backup.date) },
    { $set: { userId: user._id, date: new Date(backup.date), exercises } },
    { upsert: true, new: true },
  );

  logger.info(`Restored workout for ${backup.email}`, {
    workoutId: workout._id.toString(),
    exercises: exercises.length,
    sets: exercises.reduce((count, exercise) => count + exercise.sets.length, 0),
  });

  await mongoose.disconnect();
}

const filePath = process.argv[2];
if (!filePath) {
  logger.error('Usage: npm run restore-workout -- <path-to-backup.json>');
  process.exit(1);
}

restore(filePath).catch((error) => {
  logger.error('Restore failed', { message: (error as Error).message });
  process.exit(1);
});
