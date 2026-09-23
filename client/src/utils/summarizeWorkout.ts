import type { Workout } from '../types/workout';

export function summarizeWorkout(workout: Workout): string {
  if (workout.exercises.length === 0) {
    return 'ללא תרגילים';
  }
  const setCount = workout.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
  const names = workout.exercises.map((exercise) => exercise.exerciseName).join(', ');
  return `${names} · ${setCount} סטים`;
}
