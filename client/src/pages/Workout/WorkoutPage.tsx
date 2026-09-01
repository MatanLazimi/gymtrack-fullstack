import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { exerciseApi } from '../../services/api/exerciseApi';
import { workoutApi } from '../../services/api/workoutApi';
import type { MeasurementUnit } from '../../types/exercise';
import type { SetInput, Workout, WorkoutExercise } from '../../types/workout';
import { toUserMessage } from '../../utils/errorMessages';
import { formatSet } from '../../utils/formatSet';
import styles from './WorkoutPage.module.css';

function ExerciseSetLogger({
  exercise,
  measurementUnit,
  onAddSet,
}: {
  exercise: WorkoutExercise;
  measurementUnit: MeasurementUnit;
  onAddSet: (setInput: SetInput) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [reps, setReps] = useState('');
  const [hasAdditionalWeight, setHasAdditionalWeight] = useState(false);
  const [isPerSide, setIsPerSide] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onAddSet({
        value: Number(value),
        reps: Number(reps),
        hasAdditionalWeight,
        isPerSide,
      });
      setValue('');
      setReps('');
      setHasAdditionalWeight(false);
      setIsPerSide(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.exerciseHeader}>
        <span className={styles.exerciseName}>{exercise.exerciseName}</span>
        <span className={styles.unitBadge}>{measurementUnit === 'kg' ? 'ק"ג' : 'חור'}</span>
      </div>

      <div className={styles.setList}>
        {exercise.sets.length === 0 && <p className={styles.noSets}>עדיין אין סטים לתרגיל הזה.</p>}
        {exercise.sets.map((set, index) => (
          <div key={set._id} className={styles.setRow}>
            <span className={styles.setIndex}>{index + 1}.</span>
            <span>{formatSet(set, measurementUnit)}</span>
          </div>
        ))}
      </div>

      <form className={styles.setForm} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <input
            className={styles.input}
            type="number"
            inputMode="decimal"
            step="0.5"
            min="0"
            placeholder={measurementUnit === 'kg' ? 'משקל' : 'חור'}
            value={value}
            onChange={(event) => setValue(event.target.value)}
            required
          />
          <input
            className={styles.input}
            type="number"
            inputMode="numeric"
            min="0"
            placeholder="חזרות"
            value={reps}
            onChange={(event) => setReps(event.target.value)}
            required
          />
        </div>

        {measurementUnit === 'kg' && (
          <div className={styles.flags}>
            <label className={styles.flagLabel}>
              <input
                type="checkbox"
                checked={hasAdditionalWeight}
                onChange={(event) => setHasAdditionalWeight(event.target.checked)}
              />
              תוספת
            </label>
            <label className={styles.flagLabel}>
              <input type="checkbox" checked={isPerSide} onChange={(event) => setIsPerSide(event.target.checked)} />
              כל צד
            </label>
          </div>
        )}

        <button type="submit" className={styles.addButton} disabled={isSubmitting}>
          {isSubmitting ? 'מוסיף…' : '+ הוספת סט'}
        </button>
      </form>
    </div>
  );
}

export function WorkoutPage() {
  const { id } = useParams<{ id: string }>();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [unitByExerciseId, setUnitByExerciseId] = useState<Record<string, MeasurementUnit>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isCancelled = false;

    Promise.all([workoutApi.get(id), exerciseApi.list()])
      .then(([workoutResponse, exerciseResponse]) => {
        if (isCancelled) return;
        setWorkout(workoutResponse.workout);
        const units: Record<string, MeasurementUnit> = {};
        for (const exercise of exerciseResponse.exercises) {
          units[exercise._id] = exercise.measurementUnit;
        }
        setUnitByExerciseId(units);
      })
      .catch((fetchError) => {
        if (!isCancelled) setError(toUserMessage(fetchError));
      })
      .finally(() => {
        if (!isCancelled) setIsLoading(false);
      });

    return () => {
      isCancelled = true;
    };
  }, [id]);

  const handleAddSet = async (exerciseId: string, setInput: SetInput) => {
    if (!workout) return;
    const updatedExercises = workout.exercises.map((exercise) =>
      exercise.exerciseId === exerciseId
        ? { ...exercise, sets: [...exercise.sets, { ...setInput, _id: 'pending' }] }
        : exercise,
    );
    try {
      const response = await workoutApi.updateExercises(workout._id, updatedExercises);
      setWorkout(response.workout);
    } catch (addSetError) {
      setError(toUserMessage(addSetError));
    }
  };

  if (isLoading) {
    return <div className={styles.screen} />;
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Link to="/" className={styles.back} aria-label="חזרה">
          ←
        </Link>
        <h1 className={styles.title}>אימון פעיל</h1>
      </header>

      <div className={styles.content}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {workout?.exercises.map((exercise) => (
          <ExerciseSetLogger
            key={exercise._id}
            exercise={exercise}
            measurementUnit={unitByExerciseId[exercise.exerciseId] ?? 'kg'}
            onAddSet={(setInput) => handleAddSet(exercise.exerciseId, setInput)}
          />
        ))}
      </div>
    </div>
  );
}
