import type { Routine, RoutineExercise } from '../../types/routine';
import { apiClient } from './client';

interface RoutineResponse {
  routine: Routine;
}

interface RoutineListResponse {
  routines: Routine[];
}

export const routineApi = {
  list: () => apiClient.get<RoutineListResponse>('/routines'),
  create: (input: { name: string; exercises: Array<Pick<RoutineExercise, 'exerciseId' | 'exerciseName'>> }) =>
    apiClient.post<RoutineResponse>('/routines', input),
  update: (
    id: string,
    input: { name: string; exercises: Array<Pick<RoutineExercise, 'exerciseId' | 'exerciseName'>> },
  ) => apiClient.put<RoutineResponse>(`/routines/${id}`, input),
  remove: (id: string) => apiClient.delete(`/routines/${id}`),
};
