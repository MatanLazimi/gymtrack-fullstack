import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DraggableAttributes,
  type DraggableSyntheticListeners,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { exerciseApi } from '../../services/api/exerciseApi';
import { workoutApi } from '../../services/api/workoutApi';
import type { Exercise, MeasurementUnit } from '../../types/exercise';
import type { PreviousPerformance, SetInput, Workout, WorkoutExercise } from '../../types/workout';
import { toUserMessage } from '../../utils/errorMessages';
import { formatSet } from '../../utils/formatSet';
import { formatWorkoutDate } from '../../utils/formatWorkoutDate';
import { groupExercisesByCategory } from '../../utils/groupExercisesByCategory';
import { isToday } from '../../utils/isToday';
import styles from './WorkoutPage.module.css';

function EditSetForm({
  measurementUnit,
  initialSet,
  onSave,
  onCancel,
}: {
  measurementUnit: MeasurementUnit;
  initialSet: SetInput;
  onSave: (setInput: SetInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [value, setValue] = useState(String(initialSet.value));
  const [reps, setReps] = useState(String(initialSet.reps));
  const [hasAdditionalWeight, setHasAdditionalWeight] = useState(initialSet.hasAdditionalWeight);
  const [isPerSide, setIsPerSide] = useState(initialSet.isPerSide);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setIsSubmitting(true);
    try {
      await onSave({ value: Number(value), reps: Number(reps), hasAdditionalWeight, isPerSide });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className={styles.editSetForm} onSubmit={handleSubmit}>
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

      <div className={styles.editSetActions}>
        <button type="submit" className={styles.addButton} disabled={isSubmitting}>
          {isSubmitting ? 'שומר…' : 'שמירה'}
        </button>
        <button type="button" className={styles.secondaryButton} onClick={onCancel}>
          ביטול
        </button>
      </div>
    </form>
  );
}

function ExerciseSetLogger({
  exercise,
  measurementUnit,
  workoutId,
  readOnly,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  reorderControls,
}: {
  exercise: WorkoutExercise;
  measurementUnit: MeasurementUnit;
  workoutId: string;
  readOnly: boolean;
  onAddSet: (setInput: SetInput) => Promise<void>;
  onUpdateSet?: (setId: string, setInput: SetInput) => Promise<void>;
  onDeleteSet?: (setId: string) => Promise<void>;
  reorderControls?: {
    dragHandleAttributes: DraggableAttributes;
    dragHandleListeners: DraggableSyntheticListeners;
    onMoveUp: () => void;
    onMoveDown: () => void;
    canMoveUp: boolean;
    canMoveDown: boolean;
  };
}) {
  const [value, setValue] = useState('');
  const [reps, setReps] = useState('');
  const [hasAdditionalWeight, setHasAdditionalWeight] = useState(false);
  const [isPerSide, setIsPerSide] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previousPerformance, setPreviousPerformance] = useState<PreviousPerformance | null>(null);
  const [editingSetId, setEditingSetId] = useState<string | null>(null);

  useEffect(() => {
    if (readOnly) return;
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
  }, [exercise.exerciseId, workoutId, readOnly]);

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
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={styles.card}>
      <div className={styles.exerciseHeader}>
        {reorderControls && (
          <div className={styles.reorderControls}>
            <button
              type="button"
              className={styles.dragHandle}
              aria-label={`גרירה לשינוי מיקום ${exercise.exerciseName}`}
              {...reorderControls.dragHandleAttributes}
              {...reorderControls.dragHandleListeners}
            >
              ⠿
            </button>
            <button
              type="button"
              className={styles.moveButton}
              aria-label={`הזזת ${exercise.exerciseName} למעלה`}
              disabled={!reorderControls.canMoveUp}
              onClick={reorderControls.onMoveUp}
            >
              ▲
            </button>
            <button
              type="button"
              className={styles.moveButton}
              aria-label={`הזזת ${exercise.exerciseName} למטה`}
              disabled={!reorderControls.canMoveDown}
              onClick={reorderControls.onMoveDown}
            >
              ▼
            </button>
          </div>
        )}
        <span className={styles.exerciseName}>{exercise.exerciseName}</span>
        <span className={styles.unitBadge}>{measurementUnit === 'kg' ? 'ק"ג' : 'חור'}</span>
      </div>

      <div className={styles.setList}>
        {exercise.sets.length === 0 && <p className={styles.noSets}>עדיין אין סטים לתרגיל הזה.</p>}
        {exercise.sets.map((set, index) =>
          editingSetId === set._id ? (
            <EditSetForm
              key={set._id}
              measurementUnit={measurementUnit}
              initialSet={set}
              onCancel={() => setEditingSetId(null)}
              onSave={async (setInput) => {
                await onUpdateSet?.(set._id, setInput);
                setEditingSetId(null);
              }}
            />
          ) : (
            <div key={set._id} className={styles.setRow}>
              <span className={styles.setIndex}>{index + 1}.</span>
              <span className={styles.setValue}>{formatSet(set, measurementUnit)}</span>
              {!readOnly && (
                <div className={styles.setRowActions}>
                  <button
                    type="button"
                    className={styles.iconButton}
                    aria-label={`עריכת סט ${index + 1}`}
                    onClick={() => setEditingSetId(set._id)}
                  >
                    עריכה
                  </button>
                  <button
                    type="button"
                    className={`${styles.iconButton} ${styles.deleteButton}`}
                    aria-label={`מחיקת סט ${index + 1}`}
                    onClick={() => onDeleteSet?.(set._id)}
                  >
                    מחיקה
                  </button>
                </div>
              )}
            </div>
          ),
        )}
      </div>

      {!readOnly && previousPerformance?.sets[exercise.sets.length] && (
        <p className={styles.previousPerformance}>
          בפעם קודמת (סט {exercise.sets.length + 1}):{' '}
          {formatSet(previousPerformance.sets[exercise.sets.length], measurementUnit)}
        </p>
      )}

      {!readOnly && (
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
                <input
                  type="checkbox"
                  checked={isPerSide}
                  onChange={(event) => setIsPerSide(event.target.checked)}
                />
                כל צד
              </label>
            </div>
          )}

          <button type="submit" className={styles.addButton} disabled={isSubmitting}>
            {isSubmitting ? 'מוסיף…' : '+ הוספת סט'}
          </button>
        </form>
      )}
    </div>
  );
}

function SortableExercise({
  exercise,
  measurementUnit,
  workoutId,
  onAddSet,
  onUpdateSet,
  onDeleteSet,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown,
}: {
  exercise: WorkoutExercise;
  measurementUnit: MeasurementUnit;
  workoutId: string;
  onAddSet: (setInput: SetInput) => Promise<void>;
  onUpdateSet: (setId: string, setInput: SetInput) => Promise<void>;
  onDeleteSet: (setId: string) => Promise<void>;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: exercise._id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.6 : 1 }}
    >
      <ExerciseSetLogger
        exercise={exercise}
        measurementUnit={measurementUnit}
        workoutId={workoutId}
        readOnly={false}
        onAddSet={onAddSet}
        onUpdateSet={onUpdateSet}
        onDeleteSet={onDeleteSet}
        reorderControls={{
          dragHandleAttributes: attributes,
          dragHandleListeners: listeners,
          onMoveUp,
          onMoveDown,
          canMoveUp,
          canMoveDown,
        }}
      />
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
  const [isEditUnlocked, setIsEditUnlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedForId, setLoadedForId] = useState(id);
  if (id !== loadedForId) {
    setLoadedForId(id);
    setIsEditUnlocked(false);
  }
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

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

  const isLocked = workout ? !isToday(workout.date) : false;
  const isEditable = isLocked ? isEditUnlocked : true;

  const addableExercises = exercises.filter(
    (exercise) => exercise.active && !workout?.exercises.some((we) => we.exerciseId === exercise._id),
  );
  const addableGroups = groupExercisesByCategory(addableExercises);

  const handleAddSet = async (exerciseId: string, setInput: SetInput) => {
    if (!workout || !isEditable) return;
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

  const handleUpdateSet = async (exerciseId: string, setId: string, setInput: SetInput) => {
    if (!workout || !isEditable) return;
    const updatedExercises = workout.exercises.map((exercise) =>
      exercise.exerciseId === exerciseId
        ? { ...exercise, sets: exercise.sets.map((set) => (set._id === setId ? { ...set, ...setInput } : set)) }
        : exercise,
    );
    try {
      const response = await workoutApi.updateExercises(workout._id, updatedExercises);
      setWorkout(response.workout);
    } catch (updateSetError) {
      setError(toUserMessage(updateSetError));
    }
  };

  const handleDeleteSet = async (exerciseId: string, setId: string) => {
    if (!workout || !isEditable) return;
    const previousExercises = workout.exercises;
    const updatedExercises = workout.exercises.map((exercise) =>
      exercise.exerciseId === exerciseId
        ? { ...exercise, sets: exercise.sets.filter((set) => set._id !== setId) }
        : exercise,
    );
    setWorkout({ ...workout, exercises: updatedExercises });
    try {
      const response = await workoutApi.updateExercises(workout._id, updatedExercises);
      setWorkout(response.workout);
    } catch (deleteSetError) {
      setWorkout({ ...workout, exercises: previousExercises });
      setError(toUserMessage(deleteSetError));
    }
  };

  const handleAddExercise = async (exercise: Exercise) => {
    if (!workout || !isEditable) return;
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

  const reorderExercises = async (reordered: WorkoutExercise[]) => {
    if (!workout || !isEditable) return;
    const previousExercises = workout.exercises;
    setWorkout({ ...workout, exercises: reordered });
    try {
      const response = await workoutApi.updateExercises(workout._id, reordered);
      setWorkout(response.workout);
    } catch (reorderError) {
      setWorkout({ ...workout, exercises: previousExercises });
      setError(toUserMessage(reorderError));
    }
  };

  const moveExercise = (index: number, direction: -1 | 1) => {
    if (!workout) return;
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= workout.exercises.length) return;
    const reordered = [...workout.exercises];
    [reordered[index], reordered[targetIndex]] = [reordered[targetIndex], reordered[index]];
    void reorderExercises(reordered);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!workout || !over || active.id === over.id) return;
    const oldIndex = workout.exercises.findIndex((exercise) => exercise._id === active.id);
    const newIndex = workout.exercises.findIndex((exercise) => exercise._id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    void reorderExercises(arrayMove(workout.exercises, oldIndex, newIndex));
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
        <h1 className={styles.title}>{isLocked && workout ? formatWorkoutDate(workout.date) : 'אימון פעיל'}</h1>
        {isLocked && !isEditUnlocked && <span className={styles.lockedBadge}>לצפייה בלבד</span>}
        {isLocked && (
          <button
            type="button"
            className={styles.unlockButton}
            onClick={() => setIsEditUnlocked((current) => !current)}
          >
            {isEditUnlocked ? 'נעילה מחדש' : 'עריכת אימון'}
          </button>
        )}
      </header>

      <div className={styles.content}>
        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}

        {workout &&
          !isEditable &&
          workout.exercises.map((exercise) => (
            <ExerciseSetLogger
              key={exercise._id}
              exercise={exercise}
              measurementUnit={unitByExerciseId[exercise.exerciseId] ?? 'kg'}
              workoutId={workout._id}
              readOnly
              onAddSet={(setInput) => handleAddSet(exercise.exerciseId, setInput)}
            />
          ))}

        {workout && isEditable && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext
              items={workout.exercises.map((exercise) => exercise._id)}
              strategy={verticalListSortingStrategy}
            >
              {workout.exercises.map((exercise, index) => (
                <SortableExercise
                  key={exercise._id}
                  exercise={exercise}
                  measurementUnit={unitByExerciseId[exercise.exerciseId] ?? 'kg'}
                  workoutId={workout._id}
                  onAddSet={(setInput) => handleAddSet(exercise.exerciseId, setInput)}
                  onUpdateSet={(setId, setInput) => handleUpdateSet(exercise.exerciseId, setId, setInput)}
                  onDeleteSet={(setId) => handleDeleteSet(exercise.exerciseId, setId)}
                  onMoveUp={() => moveExercise(index, -1)}
                  onMoveDown={() => moveExercise(index, 1)}
                  canMoveUp={index > 0}
                  canMoveDown={index < workout.exercises.length - 1}
                />
              ))}
            </SortableContext>
          </DndContext>
        )}

        {isEditable && !isAddingExercise && (
          <button type="button" className={styles.addExerciseToggle} onClick={() => setIsAddingExercise(true)}>
            + הוספת תרגיל
          </button>
        )}

        {isEditable && isAddingExercise && (
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

        {isEditable && (
          <button type="button" className={styles.finishButton} onClick={() => navigate('/')}>
            {isLocked ? 'סיום עריכה' : 'סיום אימון'}
          </button>
        )}
      </div>
    </div>
  );
}
