import { Schema, Types, model, type InferSchemaType } from 'mongoose';

const setSchema = new Schema(
  {
    value: { type: Number, required: true, min: 0 },
    reps: { type: Number, required: true, min: 0 },
    hasAdditionalWeight: { type: Boolean, required: true, default: false },
    isPerSide: { type: Boolean, required: true, default: false },
  },
  { _id: true },
);

const workoutExerciseSchema = new Schema(
  {
    exerciseId: { type: Schema.Types.ObjectId, required: true, ref: 'Exercise' },
    exerciseName: { type: String, required: true },
    sets: { type: [setSchema], default: [] },
  },
  { _id: true },
);

const workoutSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    date: { type: Date, required: true },
    exercises: { type: [workoutExerciseSchema], default: [] },
  },
  { timestamps: true },
);

export type Workout = InferSchemaType<typeof workoutSchema> & { _id: Types.ObjectId };

export const WorkoutModel = model('Workout', workoutSchema);
