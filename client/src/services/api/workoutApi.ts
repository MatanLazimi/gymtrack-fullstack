import type { Workout, WorkoutExercise } from '../../types/workout';
import { apiClient } from './client';

interface WorkoutResponse {
  workout: Workout;
}

interface WorkoutListResponse {
  workouts: Workout[];
}

export const workoutApi = {
  list: () => apiClient.get<WorkoutListResponse>('/workouts'),
  get: (id: string) => apiClient.get<WorkoutResponse>(`/workouts/${id}`),
  create: (exercises: Array<Pick<WorkoutExercise, 'exerciseId' | 'exerciseName'>>) =>
    apiClient.post<WorkoutResponse>('/workouts', { exercises }),
  updateExercises: (id: string, exercises: WorkoutExercise[]) =>
    apiClient.put<WorkoutResponse>(`/workouts/${id}`, { exercises }),
};
