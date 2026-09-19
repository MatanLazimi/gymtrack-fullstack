export interface RoutineExercise {
  _id: string;
  exerciseId: string;
  exerciseName: string;
}

export interface Routine {
  _id: string;
  name: string;
  exercises: RoutineExercise[];
}
