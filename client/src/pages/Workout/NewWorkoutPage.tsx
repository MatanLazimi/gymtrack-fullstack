import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { exerciseApi } from '../../services/api/exerciseApi';
import { routineApi } from '../../services/api/routineApi';
import { workoutApi } from '../../services/api/workoutApi';
import type { Exercise } from '../../types/exercise';
import type { Routine } from '../../types/routine';
import { toUserMessage } from '../../utils/errorMessages';
import { groupExercisesByCategory } from '../../utils/groupExercisesByCategory';
import { isToday } from '../../utils/isToday';
import styles from './NewWorkoutPage.module.css';

export function NewWorkoutPage() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    Promise.all([workoutApi.list(), exerciseApi.list(), routineApi.list()])
      .then(([workoutResponse, exerciseResponse, routineResponse]) => {
        if (isCancelled) return;

        const todaysWorkout = workoutResponse.workouts.find((workout) => isToday(workout.date));
        if (todaysWorkout) {
          navigate(`/workouts/${todaysWorkout._id}`, { replace: true });
          return;
        }

        setExercises(exerciseResponse.exercises.filter((exercise) => exercise.active));
        setRoutines(routineResponse.routines);
        setIsLoading(false);
      })
      .catch((fetchError) => {
        if (!isCancelled) {
          setError(toUserMessage(fetchError));
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [navigate]);

  const handleStartFromRoutine = async (routine: Routine) => {
    setError(null);
    setIsStarting(true);
    try {
      const selected = routine.exercises.map(({ exerciseId, exerciseName }) => ({ exerciseId, exerciseName }));
      const response = await workoutApi.create(selected);
      navigate(`/workouts/${response.workout._id}`);
    } catch (startError) {
      setError(toUserMessage(startError));
      setIsStarting(false);
    }
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleStart = async () => {
    setError(null);
    setIsStarting(true);
    try {
      const selected = exercises
        .filter((exercise) => selectedIds.has(exercise._id))
        .map((exercise) => ({ exerciseId: exercise._id, exerciseName: exercise.name }));
      const response = await workoutApi.create(selected);
      navigate(`/workouts/${response.workout._id}`);
    } catch (startError) {
      setError(toUserMessage(startError));
      setIsStarting(false);
    }
  };

  const groups = groupExercisesByCategory(exercises);

  if (isLoading) {
    return <div className={styles.screen} />;
  }

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Link to="/" className={styles.back} aria-label="חזרה">
          ←
        </Link>
        <h1 className={styles.title}>בחירת תרגילים</h1>
      </header>

      <div className={styles.content}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {routines.length > 0 && (
          <div>
            <p className={styles.category}>התחלה מתבנית</p>
            <div className={styles.list}>
              {routines.map((routine) => (
                <button
                  key={routine._id}
                  type="button"
                  className={styles.routineButton}
                  disabled={isStarting}
                  onClick={() => handleStartFromRoutine(routine)}
                >
                  <span>{routine.name}</span>
                  <span className={styles.routineCount}>{routine.exercises.length} תרגילים</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {routines.length > 0 && <p className={styles.category}>או בחירה חופשית</p>}

        {groups.length === 0 && (
          <p className={styles.empty}>
            אין עדיין תרגילים פעילים. אפשר להוסיף תרגילים <Link to="/exercises">במאגר התרגילים</Link>.
          </p>
        )}

        {groups.map((group) => (
          <div key={group.category}>
            <p className={styles.category}>{group.category}</p>
            <div className={styles.list}>
              {group.exercises.map((exercise) => (
                <label key={exercise._id} className={styles.checkboxRow}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(exercise._id)}
                    onChange={() => toggleSelected(exercise._id)}
                  />
                  <span>{exercise.name}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className={styles.footer}>
        <button
          type="button"
          className={styles.startButton}
          disabled={selectedIds.size === 0 || isStarting}
          onClick={handleStart}
        >
          {isStarting ? 'מתחיל…' : `התחלת אימון (${selectedIds.size})`}
        </button>
      </div>
    </div>
  );
}
