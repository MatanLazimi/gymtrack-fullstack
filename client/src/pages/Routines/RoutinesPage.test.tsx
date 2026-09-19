import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoutinesPage } from './RoutinesPage';

const EXERCISES = [
  { _id: 'ex1', name: 'לחיצות חזה', category: 'חזה', measurementUnit: 'kg', active: true },
  { _id: 'ex2', name: 'סקוואט במכשיר', category: 'רגליים', measurementUnit: 'kg', active: true },
];

const ROUTINES = [{ _id: 'r1', name: 'דחיפה', exercises: [{ _id: 're1', exerciseId: 'ex1', exerciseName: 'לחיצות חזה' }] }];

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
    <MemoryRouter initialEntries={['/routines']}>
      <RoutinesPage />
    </MemoryRouter>,
  );
}

describe('RoutinesPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders saved routines with their exercise count', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchSequence([
        { ok: true, status: 200, body: { routines: ROUTINES } },
        { ok: true, status: 200, body: { exercises: EXERCISES } },
      ]),
    );

    renderPage();

    expect(await screen.findByText('דחיפה')).toBeInTheDocument();
    expect(screen.getByText('1 תרגילים')).toBeInTheDocument();
  });

  it('shows the empty state when there are no routines', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchSequence([
        { ok: true, status: 200, body: { routines: [] } },
        { ok: true, status: 200, body: { exercises: EXERCISES } },
      ]),
    );

    renderPage();

    expect(await screen.findByText('עדיין אין תבניות שמורות.')).toBeInTheDocument();
  });

  it('creates a routine from a name and a selected exercise', async () => {
    const created = { _id: 'r2', name: 'משיכה', exercises: [{ _id: 're2', exerciseId: 'ex2', exerciseName: 'סקוואט במכשיר' }] };
    vi.stubGlobal(
      'fetch',
      mockFetchSequence([
        { ok: true, status: 200, body: { routines: [] } },
        { ok: true, status: 200, body: { exercises: EXERCISES } },
        { ok: true, status: 201, body: { routine: created } },
      ]),
    );

    renderPage();
    await screen.findByText('עדיין אין תבניות שמורות.');

    await userEvent.click(screen.getByRole('button', { name: '+ תבנית חדשה' }));
    await userEvent.type(screen.getByPlaceholderText('שם התבנית (למשל: דחיפה)'), created.name);
    await userEvent.click(screen.getByLabelText('סקוואט במכשיר'));
    await userEvent.click(screen.getByRole('button', { name: 'שמירה' }));

    await waitFor(() => expect(screen.getByText(created.name)).toBeInTheDocument());
  });

  it('deletes a routine', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchSequence([
        { ok: true, status: 200, body: { routines: ROUTINES } },
        { ok: true, status: 200, body: { exercises: EXERCISES } },
        { ok: true, status: 204, body: undefined },
      ]),
    );

    renderPage();
    await screen.findByText('דחיפה');

    await userEvent.click(screen.getByRole('button', { name: 'מחיקת דחיפה' }));

    await waitFor(() => expect(screen.queryByText('דחיפה')).not.toBeInTheDocument());
  });
});
