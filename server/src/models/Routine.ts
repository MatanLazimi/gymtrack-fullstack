import { Schema, Types, model, type InferSchemaType } from 'mongoose';

const routineExerciseSchema = new Schema(
  {
    exerciseId: { type: Schema.Types.ObjectId, required: true, ref: 'Exercise' },
    exerciseName: { type: String, required: true },
  },
  { _id: true },
);

const routineSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    name: { type: String, required: true, trim: true },
    exercises: { type: [routineExerciseSchema], default: [] },
  },
  { timestamps: true },
);

export type Routine = InferSchemaType<typeof routineSchema> & { _id: Types.ObjectId };

export const RoutineModel = model('Routine', routineSchema);
