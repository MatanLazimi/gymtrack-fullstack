import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { workoutApi } from '../../services/api/workoutApi';
import type { Workout } from '../../types/workout';
import { toUserMessage } from '../../utils/errorMessages';
import { formatWorkoutDate } from '../../utils/formatWorkoutDate';
import { summarizeWorkout } from '../../utils/summarizeWorkout';
import styles from './HistoryPage.module.css';

export function HistoryPage() {
  const [workouts, setWorkouts] = useState<Workout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;
    workoutApi
      .list()
      .then((response) => {
        if (!isCancelled) setWorkouts(response.workouts);
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

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Link to="/" className={styles.back} aria-label="חזרה">
          ←
        </Link>
        <h1 className={styles.title}>היסטוריית אימונים</h1>
      </header>

      <div className={styles.content}>
        {error && (
          <p role="alert" className={styles.empty}>
            {error}
          </p>
        )}

        {!isLoading && !error && workouts.length === 0 && (
          <p className={styles.empty}>עדיין אין אימונים שמורים. בואו נתחיל את הראשון.</p>
        )}

        {workouts.map((workout) => (
          <Link key={workout._id} to={`/workouts/${workout._id}`} className={styles.entry}>
            <p className={styles.date}>{formatWorkoutDate(workout.date)}</p>
            <p className={styles.summary}>{summarizeWorkout(workout)}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
