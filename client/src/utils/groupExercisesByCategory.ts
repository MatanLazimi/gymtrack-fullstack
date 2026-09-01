import type { Exercise } from '../types/exercise';

export interface ExerciseCategoryGroup {
  category: string;
  exercises: Exercise[];
}

export function groupExercisesByCategory(exercises: Exercise[]): ExerciseCategoryGroup[] {
  const groups = new Map<string, Exercise[]>();
  for (const exercise of exercises) {
    const group = groups.get(exercise.category) ?? [];
    group.push(exercise);
    groups.set(exercise.category, group);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b, 'he'))
    .map(([category, categoryExercises]) => ({ category, exercises: categoryExercises }));
}
