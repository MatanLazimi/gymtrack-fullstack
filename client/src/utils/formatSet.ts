import type { MeasurementUnit } from '../types/exercise';
import type { WorkoutSet } from '../types/workout';

export function formatSet(set: WorkoutSet, measurementUnit: MeasurementUnit): string {
  if (measurementUnit === 'hole') {
    return `חור ${set.value} × ${set.reps}`;
  }

  const perSide = set.isPerSide ? ' כל צד' : '';
  const additional = set.hasAdditionalWeight ? ' + תוספת' : '';
  return `${set.value} ק"ג${perSide}${additional} × ${set.reps}`;
}
