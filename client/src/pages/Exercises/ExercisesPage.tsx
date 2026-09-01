import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { exerciseApi } from '../../services/api/exerciseApi';
import type { Exercise, MeasurementUnit } from '../../types/exercise';
import { formatMeasurementUnit } from '../../utils/formatMeasurementUnit';
import { toUserMessage } from '../../utils/errorMessages';
import { groupExercisesByCategory } from '../../utils/groupExercisesByCategory';
import styles from './ExercisesPage.module.css';

export function ExercisesPage() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [measurementUnit, setMeasurementUnit] = useState<MeasurementUnit>('kg');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    exerciseApi
      .list()
      .then((response) => {
        if (!isCancelled) setExercises(response.exercises);
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

  const handleAdd = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await exerciseApi.create({ name, category, measurementUnit });
      setExercises((current) => [...current, response.exercise]);
      setName('');
      setCategory('');
      setMeasurementUnit('kg');
      setIsFormOpen(false);
    } catch (submitError) {
      setError(toUserMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (exercise: Exercise) => {
    const nextActive = !exercise.active;
    setExercises((current) => current.map((item) => (item._id === exercise._id ? { ...item, active: nextActive } : item)));
    try {
      await exerciseApi.setActive(exercise._id, nextActive);
    } catch (toggleError) {
      setExercises((current) =>
        current.map((item) => (item._id === exercise._id ? { ...item, active: exercise.active } : item)),
      );
      setError(toUserMessage(toggleError));
    }
  };

  const handleDelete = async (exercise: Exercise) => {
    const previous = exercises;
    setExercises((current) => current.filter((item) => item._id !== exercise._id));
    try {
      await exerciseApi.remove(exercise._id);
    } catch (deleteError) {
      setExercises(previous);
      setError(toUserMessage(deleteError));
    }
  };

  const groups = groupExercisesByCategory(exercises);

  return (
    <div className={styles.screen}>
      <header className={styles.header}>
        <Link to="/" className={styles.back} aria-label="חזרה">
          ←
        </Link>
        <h1 className={styles.title}>מאגר תרגילים</h1>
      </header>

      <div className={styles.content}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {!isFormOpen && (
          <button type="button" className={styles.addToggle} onClick={() => setIsFormOpen(true)}>
            + תרגיל חדש
          </button>
        )}

        {isFormOpen && (
          <form className={styles.addForm} onSubmit={handleAdd}>
            <input
              className={styles.input}
              placeholder="שם התרגיל"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />
            <div className={styles.row}>
              <input
                className={styles.input}
                placeholder="קטגוריה (למשל: חזה)"
                value={category}
                onChange={(event) => setCategory(event.target.value)}
                required
              />
              <select
                className={styles.select}
                value={measurementUnit}
                onChange={(event) => setMeasurementUnit(event.target.value as MeasurementUnit)}
              >
                <option value="kg">ק"ג</option>
                <option value="hole">חור</option>
              </select>
            </div>
            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryButton} disabled={isSubmitting}>
                {isSubmitting ? 'שומר…' : 'שמירה'}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={() => setIsFormOpen(false)}>
                ביטול
              </button>
            </div>
          </form>
        )}

        {!isLoading && groups.length === 0 && <p className={styles.empty}>עדיין אין תרגילים במאגר.</p>}

        {groups.map((group) => (
          <div key={group.category}>
            <p className={styles.category}>{group.category}</p>
            <div className={styles.list}>
              {group.exercises.map((exercise) => (
                <div key={exercise._id} className={exercise.active ? styles.item : `${styles.item} ${styles.itemInactive}`}>
                  <span className={styles.itemName}>{exercise.name}</span>
                  <span className={styles.unitBadge}>{formatMeasurementUnit(exercise.measurementUnit)}</span>
                  <button type="button" className={styles.iconButton} onClick={() => handleToggleActive(exercise)}>
                    {exercise.active ? 'השבתה' : 'הפעלה'}
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.deleteButton}`}
                    onClick={() => handleDelete(exercise)}
                    aria-label={`מחיקת ${exercise.name}`}
                  >
                    מחיקה
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
