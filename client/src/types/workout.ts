export interface WorkoutSet {
  _id: string;
  value: number;
  reps: number;
  hasAdditionalWeight: boolean;
  isPerSide: boolean;
}

export interface WorkoutExercise {
  _id: string;
  exerciseId: string;
  exerciseName: string;
  sets: WorkoutSet[];
}

export interface Workout {
  _id: string;
  userId: string;
  date: string;
  exercises: WorkoutExercise[];
}

export interface SetInput {
  value: number;
  reps: number;
  hasAdditionalWeight: boolean;
  isPerSide: boolean;
}

export interface PreviousPerformance {
  date: string;
  exerciseName: string;
  sets: WorkoutSet[];
}
