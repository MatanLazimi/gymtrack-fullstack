import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { exerciseApi } from '../../services/api/exerciseApi';
import { workoutApi } from '../../services/api/workoutApi';
import type { Exercise } from '../../types/exercise';
import { toUserMessage } from '../../utils/errorMessages';
import { groupExercisesByCategory } from '../../utils/groupExercisesByCategory';
import styles from './NewWorkoutPage.module.css';

export function NewWorkoutPage() {
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    exerciseApi
      .list()
      .then((response) => {
        if (!isCancelled) setExercises(response.exercises.filter((exercise) => exercise.active));
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
  }, []);

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

        {!isLoading && groups.length === 0 && (
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
