import { Schema, Types, model, type InferSchemaType } from 'mongoose';

export const MEASUREMENT_UNITS = ['kg', 'hole'] as const;
export type MeasurementUnit = (typeof MEASUREMENT_UNITS)[number];

const exerciseSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    measurementUnit: { type: String, required: true, enum: MEASUREMENT_UNITS },
    active: { type: Boolean, required: true, default: true },
  },
  { timestamps: true },
);

export type Exercise = InferSchemaType<typeof exerciseSchema> & { _id: Types.ObjectId };

export const ExerciseModel = model('Exercise', exerciseSchema);
