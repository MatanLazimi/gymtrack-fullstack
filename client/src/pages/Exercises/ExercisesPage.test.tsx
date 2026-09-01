import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ExercisesPage } from './ExercisesPage';

const EXERCISES = [
  { _id: '1', name: 'לחיצות חזה', category: 'חזה', measurementUnit: 'kg', active: true },
  { _id: '2', name: 'סקוואט במכשיר', category: 'רגליים', measurementUnit: 'kg', active: false },
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

function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/exercises']}>
      <ExercisesPage />
    </MemoryRouter>,
  );
}

describe('ExercisesPage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders exercises grouped by category once loaded', async () => {
    vi.stubGlobal('fetch', mockFetchSequence([{ ok: true, status: 200, body: { exercises: EXERCISES } }]));

    renderPage();

    expect(await screen.findByText('לחיצות חזה')).toBeInTheDocument();
    expect(screen.getByText('סקוואט במכשיר')).toBeInTheDocument();
    expect(screen.getByText('חזה')).toBeInTheDocument();
    expect(screen.getByText('רגליים')).toBeInTheDocument();
  });

  it('shows the empty state when there are no exercises', async () => {
    vi.stubGlobal('fetch', mockFetchSequence([{ ok: true, status: 200, body: { exercises: [] } }]));

    renderPage();

    expect(await screen.findByText('עדיין אין תרגילים במאגר.')).toBeInTheDocument();
  });

  it('adds a new exercise through the form', async () => {
    const created = { _id: '3', name: 'מתח', category: 'גב', measurementUnit: 'kg', active: true };
    vi.stubGlobal(
      'fetch',
      mockFetchSequence([
        { ok: true, status: 200, body: { exercises: [] } },
        { ok: true, status: 201, body: { exercise: created } },
      ]),
    );

    renderPage();
    await screen.findByText('עדיין אין תרגילים במאגר.');

    await userEvent.click(screen.getByRole('button', { name: '+ תרגיל חדש' }));
    await userEvent.type(screen.getByPlaceholderText('שם התרגיל'), created.name);
    await userEvent.type(screen.getByPlaceholderText('קטגוריה (למשל: חזה)'), created.category);
    await userEvent.click(screen.getByRole('button', { name: 'שמירה' }));

    await waitFor(() => expect(screen.getByText(created.name)).toBeInTheDocument());
  });
});
