import type { Exercise, ExerciseInput } from '../../types/exercise';
import { apiClient } from './client';

interface ExerciseListResponse {
  exercises: Exercise[];
}

interface ExerciseResponse {
  exercise: Exercise;
}

export const exerciseApi = {
  list: () => apiClient.get<ExerciseListResponse>('/exercises'),
  create: (input: ExerciseInput) => apiClient.post<ExerciseResponse>('/exercises', input),
  setActive: (id: string, active: boolean) => apiClient.put<ExerciseResponse>(`/exercises/${id}`, { active }),
  remove: (id: string) => apiClient.delete(`/exercises/${id}`),
};
