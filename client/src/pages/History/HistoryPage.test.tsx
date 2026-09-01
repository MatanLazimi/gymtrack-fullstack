import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HistoryPage } from './HistoryPage';

function mockFetchOnce(body: unknown) {
  return vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => body });
}

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/history']}>
      <Routes>
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/workouts/:id" element={<div>workout detail page</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('HistoryPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('shows an empty state when there are no past workouts', async () => {
    vi.stubGlobal('fetch', mockFetchOnce({ workouts: [] }));

    renderPage();

    expect(await screen.findByText('עדיין אין אימונים שמורים. בואו נתחיל את הראשון.')).toBeInTheDocument();
  });

  it('lists past workouts with a date and exercise/set summary', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchOnce({
        workouts: [
          {
            _id: 'w1',
            date: '2026-01-08T00:00:00.000Z',
            exercises: [
              { _id: 'we1', exerciseId: 'ex1', exerciseName: 'לחיצות חזה', sets: [{ _id: 's1' }, { _id: 's2' }] },
            ],
          },
        ],
      }),
    );

    renderPage();

    expect(await screen.findByText(/לחיצות חזה/)).toBeInTheDocument();
    expect(screen.getByText(/2 סטים/)).toBeInTheDocument();
  });

  it('links each entry to its workout detail page', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchOnce({
        workouts: [{ _id: 'w1', date: '2026-01-08T00:00:00.000Z', exercises: [] }],
      }),
    );

    renderPage();

    const link = await screen.findByRole('link', { name: /ללא תרגילים/ });
    expect(link).toHaveAttribute('href', '/workouts/w1');
  });
});
