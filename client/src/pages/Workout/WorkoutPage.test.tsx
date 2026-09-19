import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { WorkoutPage } from './WorkoutPage';

const WORKOUT = {
  _id: 'w1',
  userId: 'u1',
  date: new Date().toISOString(),
  exercises: [
    {
      _id: 'we1',
      exerciseId: 'ex1',
      exerciseName: 'לחיצות חזה',
      sets: [{ _id: 's1', value: 60, reps: 12, hasAdditionalWeight: false, isPerSide: false }],
    },
  ],
};

const WORKOUT_WITH_TWO_EXERCISES = {
  ...WORKOUT,
  exercises: [
    ...WORKOUT.exercises,
    { _id: 'we2', exerciseId: 'ex2', exerciseName: 'סקוואט במכשיר', sets: [] },
  ],
};

const PAST_WORKOUT = {
  _id: 'w2',
  userId: 'u1',
  date: '2026-01-08T00:00:00.000Z',
  exercises: [
    {
      _id: 'we1',
      exerciseId: 'ex1',
      exerciseName: 'לחיצות חזה',
      sets: [{ _id: 's1', value: 60, reps: 12, hasAdditionalWeight: false, isPerSide: false }],
    },
  ],
};

const EXERCISES = [
  { _id: 'ex1', name: 'לחיצות חזה', category: 'חזה', measurementUnit: 'kg', active: true },
  { _id: 'ex2', name: 'סקוואט במכשיר', category: 'רגליים', measurementUnit: 'kg', active: true },
];

interface MockRoute {
  url: string;
  method?: string;
  response: { ok: boolean; status: number; body: unknown };
}

function mockFetchRouter(routes: MockRoute[]) {
  return vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const pathname = new URL(String(input)).pathname;
    const method = init?.method ?? 'GET';
    const route = routes.find((r) => pathname === r.url && (r.method ?? 'GET') === method);
    if (!route) {
      throw new Error(`No mock route for ${method} ${pathname}`);
    }
    return { ok: route.response.ok, status: route.response.status, json: async () => route.response.body };
  });
}

const noPreviousPerformance = {
  url: '/api/exercises/ex1/history',
  response: { ok: true, status: 200, body: { previousPerformance: null } },
};
const noPreviousPerformanceEx2 = {
  url: '/api/exercises/ex2/history',
  response: { ok: true, status: 200, body: { previousPerformance: null } },
};
const listExercises = { url: '/api/exercises', response: { ok: true, status: 200, body: { exercises: EXERCISES } } };
const getWorkout = { url: '/api/workouts/w1', response: { ok: true, status: 200, body: { workout: WORKOUT } } };
const getWorkoutWithTwoExercises = {
  url: '/api/workouts/w1',
  response: { ok: true, status: 200, body: { workout: WORKOUT_WITH_TWO_EXERCISES } },
};
const getPastWorkout = { url: '/api/workouts/w2', response: { ok: true, status: 200, body: { workout: PAST_WORKOUT } } };

function renderPage(workoutId = 'w1') {
  return render(
    <MemoryRouter initialEntries={[`/workouts/${workoutId}`]}>
      <Routes>
        <Route path="/workouts/:id" element={<WorkoutPage />} />
        <Route path="/" element={<div>dashboard page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('WorkoutPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the existing set formatted with the exercise unit', async () => {
    vi.stubGlobal('fetch', mockFetchRouter([getWorkout, listExercises, noPreviousPerformance]));

    renderPage();

    expect(await screen.findByText('60 ק"ג × 12')).toBeInTheDocument();
  });

  it('shows a "previous time" hint matched to the set position about to be logged', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchRouter([
        getWorkout,
        {
          url: '/api/exercises/ex1/history',
          response: {
            ok: true,
            status: 200,
            body: {
              previousPerformance: {
                date: '2026-01-01',
                exerciseName: 'לחיצות חזה',
                sets: [
                  { _id: 'p1', value: 50, reps: 12, hasAdditionalWeight: false, isPerSide: false },
                  { _id: 'p2', value: 55, reps: 10, hasAdditionalWeight: false, isPerSide: false },
                ],
              },
            },
          },
        },
        listExercises,
      ]),
    );

    renderPage();

    // WORKOUT's exercise already has one logged set, so the next set to fill in is set #2 -
    // the hint should show the previous performance at that same position, not the whole list.
    expect(await screen.findByText('בפעם קודמת (סט 2): 55 ק"ג × 10')).toBeInTheDocument();
  });

  it('adds a new set through the form', async () => {
    const updatedWorkout = {
      ...WORKOUT,
      exercises: [
        {
          ...WORKOUT.exercises[0],
          sets: [...WORKOUT.exercises[0].sets, { _id: 's2', value: 65, reps: 8, hasAdditionalWeight: false, isPerSide: false }],
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      mockFetchRouter([
        getWorkout,
        listExercises,
        noPreviousPerformance,
        {
          url: '/api/workouts/w1',
          method: 'PUT',
          response: { ok: true, status: 200, body: { workout: updatedWorkout } },
        },
      ]),
    );

    renderPage();
    await screen.findByText('60 ק"ג × 12');

    const weightInput = screen.getByPlaceholderText('משקל');
    const repsInput = screen.getByPlaceholderText('חזרות');
    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, '65');
    await userEvent.clear(repsInput);
    await userEvent.type(repsInput, '8');
    await userEvent.click(screen.getByRole('button', { name: '+ הוספת סט' }));

    expect(await screen.findByText('65 ק"ג × 8')).toBeInTheDocument();
  });

  it('pre-fills the add-set form with the last logged set, so consecutive sets need no retyping', async () => {
    vi.stubGlobal('fetch', mockFetchRouter([getWorkout, listExercises, noPreviousPerformance]));

    renderPage();
    await screen.findByText('60 ק"ג × 12');

    expect(screen.getByPlaceholderText('משקל')).toHaveValue(60);
    expect(screen.getByPlaceholderText('חזרות')).toHaveValue(12);
  });

  it('adds another exercise to the workout, only offering ones not already added', async () => {
    const updatedWorkout = {
      ...WORKOUT,
      exercises: [
        ...WORKOUT.exercises,
        { _id: 'we2', exerciseId: 'ex2', exerciseName: 'סקוואט במכשיר', sets: [] },
      ],
    };
    vi.stubGlobal(
      'fetch',
      mockFetchRouter([
        getWorkout,
        listExercises,
        noPreviousPerformance,
        {
          url: '/api/workouts/w1',
          method: 'PUT',
          response: { ok: true, status: 200, body: { workout: updatedWorkout } },
        },
      ]),
    );

    renderPage();
    await screen.findByText('60 ק"ג × 12');

    await userEvent.click(screen.getByRole('button', { name: '+ הוספת תרגיל' }));
    expect(screen.queryByText('לחיצות חזה', { selector: 'button' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'סקוואט במכשיר' }));

    expect(await screen.findByText('עדיין אין סטים לתרגיל הזה.')).toBeInTheDocument();
  });

  it('reorders exercises using the move-up/move-down buttons', async () => {
    const reorderedWorkout = {
      ...WORKOUT_WITH_TWO_EXERCISES,
      exercises: [...WORKOUT_WITH_TWO_EXERCISES.exercises].reverse(),
    };
    vi.stubGlobal(
      'fetch',
      mockFetchRouter([
        getWorkoutWithTwoExercises,
        listExercises,
        noPreviousPerformance,
        noPreviousPerformanceEx2,
        {
          url: '/api/workouts/w1',
          method: 'PUT',
          response: { ok: true, status: 200, body: { workout: reorderedWorkout } },
        },
      ]),
    );

    renderPage();
    await screen.findByText('60 ק"ג × 12');

    const exerciseNamesInOrder = () =>
      screen.getAllByText(/^(לחיצות חזה|סקוואט במכשיר)$/).map((el) => el.textContent);

    expect(exerciseNamesInOrder()).toEqual(['לחיצות חזה', 'סקוואט במכשיר']);

    await userEvent.click(screen.getByRole('button', { name: 'הזזת לחיצות חזה למטה' }));

    await waitFor(() => {
      expect(exerciseNamesInOrder()).toEqual(['סקוואט במכשיר', 'לחיצות חזה']);
    });
  });

  it('disables the move-up button for the first exercise and move-down for the last', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchRouter([getWorkoutWithTwoExercises, listExercises, noPreviousPerformance, noPreviousPerformanceEx2]),
    );

    renderPage();
    await screen.findByText('60 ק"ג × 12');

    expect(screen.getByRole('button', { name: 'הזזת לחיצות חזה למעלה' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'הזזת סקוואט במכשיר למטה' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'הזזת לחיצות חזה למטה' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'הזזת סקוואט במכשיר למעלה' })).toBeEnabled();
  });

  it('navigates back to the dashboard when finishing the workout', async () => {
    vi.stubGlobal('fetch', mockFetchRouter([getWorkout, listExercises, noPreviousPerformance]));

    renderPage();
    await screen.findByText('60 ק"ג × 12');

    await userEvent.click(screen.getByRole('button', { name: 'סיום אימון' }));

    expect(await screen.findByText('dashboard page')).toBeInTheDocument();
  });

  it('opens a past workout in view-only mode by default, with an option to unlock editing', async () => {
    vi.stubGlobal('fetch', mockFetchRouter([getPastWorkout, listExercises]));

    renderPage('w2');

    expect(await screen.findByText('60 ק"ג × 12')).toBeInTheDocument();
    expect(screen.getByText('לצפייה בלבד')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText('משקל')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '+ הוספת תרגיל' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'סיום אימון' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'עריכת אימון' })).toBeInTheDocument();
  });

  it('unlocks editing on a past workout after clicking the unlock button', async () => {
    vi.stubGlobal('fetch', mockFetchRouter([getPastWorkout, listExercises, noPreviousPerformance]));

    renderPage('w2');
    await screen.findByText('60 ק"ג × 12');

    await userEvent.click(screen.getByRole('button', { name: 'עריכת אימון' }));

    expect(screen.queryByText('לצפייה בלבד')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('משקל')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ הוספת תרגיל' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'סיום עריכה' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'נעילה מחדש' })).toBeInTheDocument();
  });

  it("edits an existing set's value through the inline edit form", async () => {
    const updatedWorkout = {
      ...WORKOUT,
      exercises: [
        {
          ...WORKOUT.exercises[0],
          sets: [{ _id: 's1', value: 70, reps: 12, hasAdditionalWeight: false, isPerSide: false }],
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      mockFetchRouter([
        getWorkout,
        listExercises,
        noPreviousPerformance,
        {
          url: '/api/workouts/w1',
          method: 'PUT',
          response: { ok: true, status: 200, body: { workout: updatedWorkout } },
        },
      ]),
    );

    renderPage();
    await screen.findByText('60 ק"ג × 12');

    await userEvent.click(screen.getByRole('button', { name: 'עריכת סט 1' }));
    // The inline edit form and the add-set form both have a "משקל" field; the edit form renders first.
    const weightInput = screen.getAllByPlaceholderText('משקל')[0];
    await userEvent.clear(weightInput);
    await userEvent.type(weightInput, '70');
    await userEvent.click(screen.getByRole('button', { name: 'שמירה' }));

    expect(await screen.findByText('70 ק"ג × 12')).toBeInTheDocument();
  });

  it('deletes an existing set', async () => {
    const updatedWorkout = {
      ...WORKOUT,
      exercises: [{ ...WORKOUT.exercises[0], sets: [] }],
    };
    vi.stubGlobal(
      'fetch',
      mockFetchRouter([
        getWorkout,
        listExercises,
        noPreviousPerformance,
        {
          url: '/api/workouts/w1',
          method: 'PUT',
          response: { ok: true, status: 200, body: { workout: updatedWorkout } },
        },
      ]),
    );

    renderPage();
    await screen.findByText('60 ק"ג × 12');

    await userEvent.click(screen.getByRole('button', { name: 'מחיקת סט 1' }));

    await waitFor(() => {
      expect(screen.queryByText('60 ק"ג × 12')).not.toBeInTheDocument();
    });
    expect(await screen.findByText('עדיין אין סטים לתרגיל הזה.')).toBeInTheDocument();
  });
});
