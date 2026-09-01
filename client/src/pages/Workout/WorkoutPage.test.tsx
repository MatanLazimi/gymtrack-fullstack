import { render, screen } from '@testing-library/react';
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

const EXERCISES = [{ _id: 'ex1', name: 'לחיצות חזה', category: 'חזה', measurementUnit: 'kg', active: true }];

function mockFetchSequence(responses: Array<{ ok: boolean; status: number; body: unknown }>) {
  const fn = vi.fn();
  for (const response of responses) {
    fn.mockImplementationOnce(async () => ({
      ok: response.ok,
      status: response.status,
      json: async () => response.body,
    }));
  }
  return fn;
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/workouts/w1']}>
      <Routes>
        <Route path="/workouts/:id" element={<WorkoutPage />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('WorkoutPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows the existing set formatted with the exercise unit', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchSequence([
        { ok: true, status: 200, body: { workout: WORKOUT } },
        { ok: true, status: 200, body: { exercises: EXERCISES } },
      ]),
    );

    renderPage();

    expect(await screen.findByText('60 ק"ג × 12')).toBeInTheDocument();
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
      mockFetchSequence([
        { ok: true, status: 200, body: { workout: WORKOUT } },
        { ok: true, status: 200, body: { exercises: EXERCISES } },
        { ok: true, status: 200, body: { workout: updatedWorkout } },
      ]),
    );

    renderPage();
    await screen.findByText('60 ק"ג × 12');

    await userEvent.type(screen.getByPlaceholderText('משקל'), '65');
    await userEvent.type(screen.getByPlaceholderText('חזרות'), '8');
    await userEvent.click(screen.getByRole('button', { name: '+ הוספת סט' }));

    expect(await screen.findByText('65 ק"ג × 8')).toBeInTheDocument();
  });
});
