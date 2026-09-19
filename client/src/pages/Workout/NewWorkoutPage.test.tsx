import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { NewWorkoutPage } from './NewWorkoutPage';

const EXERCISES = [
  { _id: '1', name: 'לחיצות חזה', category: 'חזה', measurementUnit: 'kg', active: true },
  { _id: '2', name: 'תרגיל מושבת', category: 'חזה', measurementUnit: 'kg', active: false },
];

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

function renderPicker() {
  return render(
    <MemoryRouter initialEntries={['/workouts/new']}>
      <Routes>
        <Route path="/workouts/new" element={<NewWorkoutPage />} />
        <Route path="/workouts/:id" element={<div>workout page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('NewWorkoutPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('only lists active exercises when there is no workout for today', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchSequence([
        { ok: true, status: 200, body: { workouts: [] } },
        { ok: true, status: 200, body: { exercises: EXERCISES } },
        { ok: true, status: 200, body: { routines: [] } },
      ]),
    );

    renderPicker();

    expect(await screen.findByText('לחיצות חזה')).toBeInTheDocument();
    expect(screen.queryByText('תרגיל מושבת')).not.toBeInTheDocument();
  });

  it('starts a workout with the selected exercise and navigates to it', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchSequence([
        { ok: true, status: 200, body: { workouts: [] } },
        { ok: true, status: 200, body: { exercises: EXERCISES } },
        { ok: true, status: 200, body: { routines: [] } },
        { ok: true, status: 201, body: { workout: { _id: 'w1', exercises: [] } } },
      ]),
    );

    renderPicker();

    await userEvent.click(await screen.findByText('לחיצות חזה'));
    await userEvent.click(screen.getByRole('button', { name: /התחלת אימון/ }));

    expect(await screen.findByText('workout page')).toBeInTheDocument();
  });

  it('redirects straight to an existing workout for today instead of showing the picker', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchSequence([
        { ok: true, status: 200, body: { workouts: [{ _id: 'today-workout', date: new Date().toISOString() }] } },
        { ok: true, status: 200, body: { exercises: EXERCISES } },
        { ok: true, status: 200, body: { routines: [] } },
      ]),
    );

    renderPicker();

    expect(await screen.findByText('workout page')).toBeInTheDocument();
    expect(screen.queryByText('בחירת תרגילים')).not.toBeInTheDocument();
  });

  it('starts a workout from a saved routine without requiring manual exercise selection', async () => {
    const routine = { _id: 'r1', name: 'דחיפה', exercises: [{ _id: 're1', exerciseId: '1', exerciseName: 'לחיצות חזה' }] };
    vi.stubGlobal(
      'fetch',
      mockFetchSequence([
        { ok: true, status: 200, body: { workouts: [] } },
        { ok: true, status: 200, body: { exercises: EXERCISES } },
        { ok: true, status: 200, body: { routines: [routine] } },
        { ok: true, status: 201, body: { workout: { _id: 'w1', exercises: [] } } },
      ]),
    );

    renderPicker();

    await userEvent.click(await screen.findByRole('button', { name: /דחיפה/ }));

    expect(await screen.findByText('workout page')).toBeInTheDocument();
  });
});
