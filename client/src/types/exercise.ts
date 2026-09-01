export type MeasurementUnit = 'kg' | 'hole';

export interface Exercise {
  _id: string;
  name: string;
  category: string;
  measurementUnit: MeasurementUnit;
  active: boolean;
}

export interface ExerciseInput {
  name: string;
  category: string;
  measurementUnit: MeasurementUnit;
}
