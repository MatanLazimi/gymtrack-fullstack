import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { exerciseApi } from '../../services/api/exerciseApi';
import { routineApi } from '../../services/api/routineApi';
import type { Exercise } from '../../types/exercise';
import type { Routine } from '../../types/routine';
import { toUserMessage } from '../../utils/errorMessages';
import { groupExercisesByCategory } from '../../utils/groupExercisesByCategory';
import styles from './RoutinesPage.module.css';

export function RoutinesPage() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    Promise.all([routineApi.list(), exerciseApi.list()])
      .then(([routineResponse, exerciseResponse]) => {
        if (isCancelled) return;
        setRoutines(routineResponse.routines);
        setExercises(exerciseResponse.exercises.filter((exercise) => exercise.active));
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

  const resetForm = () => {
    setEditingId(null);
    setName('');
    setSelectedIds(new Set());
    setIsFormOpen(false);
  };

  const openCreateForm = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const openEditForm = (routine: Routine) => {
    setEditingId(routine._id);
    setName(routine.name);
    setSelectedIds(new Set(routine.exercises.map((exercise) => exercise.exerciseId)));
    setIsFormOpen(true);
  };

  const toggleSelected = (id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const input = {
        name,
        exercises: exercises
          .filter((exercise) => selectedIds.has(exercise._id))
          .map((exercise) => ({ exerciseId: exercise._id, exerciseName: exercise.name })),
      };
      if (editingId) {
        const response = await routineApi.update(editingId, input);
        setRoutines((current) => current.map((routine) => (routine._id === editingId ? response.routine : routine)));
      } else {
        const response = await routineApi.create(input);
        setRoutines((current) => [...current, response.routine]);
      }
      resetForm();
    } catch (submitError) {
      setError(toUserMessage(submitError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (routine: Routine) => {
    const previous = routines;
    setRoutines((current) => current.filter((item) => item._id !== routine._id));
    try {
      await routineApi.remove(routine._id);
    } catch (deleteError) {
      setRoutines(previous);
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
        <h1 className={styles.title}>תבניות אימון</h1>
      </header>

      <div className={styles.content}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {!isFormOpen && (
          <button type="button" className={styles.addToggle} onClick={openCreateForm}>
            + תבנית חדשה
          </button>
        )}

        {isFormOpen && (
          <form className={styles.addForm} onSubmit={handleSubmit}>
            <input
              className={styles.input}
              placeholder="שם התבנית (למשל: דחיפה)"
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
            />

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

            <div className={styles.formActions}>
              <button type="submit" className={styles.primaryButton} disabled={isSubmitting || selectedIds.size === 0}>
                {isSubmitting ? 'שומר…' : 'שמירה'}
              </button>
              <button type="button" className={styles.secondaryButton} onClick={resetForm}>
                ביטול
              </button>
            </div>
          </form>
        )}

        {!isLoading && routines.length === 0 && <p className={styles.empty}>עדיין אין תבניות שמורות.</p>}

        <div className={styles.list}>
          {routines.map((routine) => (
            <div key={routine._id} className={styles.item}>
              <span className={styles.itemName}>{routine.name}</span>
              <span className={styles.countBadge}>{routine.exercises.length} תרגילים</span>
              <button type="button" className={styles.iconButton} onClick={() => openEditForm(routine)}>
                עריכה
              </button>
              <button
                type="button"
                className={`${styles.iconButton} ${styles.deleteButton}`}
                onClick={() => handleDelete(routine)}
                aria-label={`מחיקת ${routine.name}`}
              >
                מחיקה
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
