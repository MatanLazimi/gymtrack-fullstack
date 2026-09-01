import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { exerciseApi } from '../../services/api/exerciseApi';
import { workoutApi } from '../../services/api/workoutApi';
import type { Exercise, MeasurementUnit } from '../../types/exercise';
import type { PreviousPerformance, SetInput, Workout, WorkoutExercise } from '../../types/workout';
import { toUserMessage } from '../../utils/errorMessages';
import { formatSet } from '../../utils/formatSet';
import { groupExercisesByCategory } from '../../utils/groupExercisesByCategory';
import styles from './WorkoutPage.module.css';

function ExerciseSetLogger({
  exercise,
  measurementUnit,
  workoutId,
  onAddSet,
}: {
  exercise: WorkoutExercise;
  measurementUnit: MeasurementUnit;
  workoutId: string;
  onAddSet: (setInput: SetInput) => Promise<void>;
}) {
  const [value, setValue] = useState('');
  const [reps, setReps] = useState('');
  const [hasAdditionalWeight, setHasAdditionalWeight] = useState(false);
  const [isPerSide, setIsPerSide] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousPerformance, setPreviousPerformance] = useState<PreviousPerformance | null>(null);

  useEffect(() => {
    let isCancelled = false;
    exerciseApi
      .getHistory(exercise.exerciseId, workoutId)
      .then((response) => {
        if (!isCancelled) setPreviousPerformance(response.previousPerformance);
      })
      .catch(() => {
        // Previous performance is a nice-to-have hint; a failed lookup shouldn't block logging sets.
      });
    return () => {
      isCancelled = true;
    };
  }, [exercise.exerciseId, workoutId]);

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

      {previousPerformance && (
        <p className={styles.previousPerformance}>
          פעם קודמת: {previousPerformance.sets.map((set) => formatSet(set, measurementUnit)).join(', ')}
        </p>
      )}

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
  const navigate = useNavigate();
  const [workout, setWorkout] = useState<Workout | null>(null);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let isCancelled = false;

    Promise.all([workoutApi.get(id), exerciseApi.list()])
      .then(([workoutResponse, exerciseResponse]) => {
        if (isCancelled) return;
        setWorkout(workoutResponse.workout);
        setExercises(exerciseResponse.exercises);
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

  const unitByExerciseId: Record<string, MeasurementUnit> = {};
  for (const exercise of exercises) {
    unitByExerciseId[exercise._id] = exercise.measurementUnit;
  }

  const addableExercises = exercises.filter(
    (exercise) => exercise.active && !workout?.exercises.some((we) => we.exerciseId === exercise._id),
  );
  const addableGroups = groupExercisesByCategory(addableExercises);

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

  const handleAddExercise = async (exercise: Exercise) => {
    if (!workout) return;
    const updatedExercises = [
      ...workout.exercises,
      { _id: 'pending', exerciseId: exercise._id, exerciseName: exercise.name, sets: [] },
    ];
    try {
      const response = await workoutApi.updateExercises(workout._id, updatedExercises);
      setWorkout(response.workout);
      setIsAddingExercise(false);
    } catch (addExerciseError) {
      setError(toUserMessage(addExerciseError));
    }
  };

  if (isLoading) {
    return <div className={styles.screen} />;
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Link to="/" className={styles.back} aria-label="חזרה לדשבורד">
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
            workoutId={workout._id}
            onAddSet={(setInput) => handleAddSet(exercise.exerciseId, setInput)}
          />
        ))}

        {!isAddingExercise && (
          <button type="button" className={styles.addExerciseToggle} onClick={() => setIsAddingExercise(true)}>
            + הוספת תרגיל
          </button>
        )}

        {isAddingExercise && (
          <div className={styles.addExercisePicker}>
            <div className={styles.addExercisePickerHeader}>
              <span>בחירת תרגיל להוספה</span>
              <button type="button" className={styles.closeButton} onClick={() => setIsAddingExercise(false)}>
                סגירה
              </button>
            </div>
            {addableGroups.length === 0 && (
              <p className={styles.noSets}>כל התרגילים הפעילים כבר באימון הזה.</p>
            )}
            {addableGroups.map((group) => (
              <div key={group.category}>
                <p className={styles.category}>{group.category}</p>
                <div className={styles.list}>
                  {group.exercises.map((exercise) => (
                    <button
                      key={exercise._id}
                      type="button"
                      className={styles.addExerciseRow}
                      onClick={() => handleAddExercise(exercise)}
                    >
                      {exercise.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <button type="button" className={styles.finishButton} onClick={() => navigate('/')}>
          סיום אימון
        </button>
      </div>
    </div>
  );
}
