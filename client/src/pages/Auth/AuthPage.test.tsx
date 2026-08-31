import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthProvider } from '../../context/AuthContext';
import { AuthPage } from './AuthPage';

function mockFetchOnce(response: { ok: boolean; status: number; body: unknown }) {
  return vi.fn().mockResolvedValue({
    ok: response.ok,
    status: response.status,
    json: async () => response.body,
  });
}

function renderAuthPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe('AuthPage', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetchOnce({ ok: false, status: 401, body: { error: 'Authentication required' } }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to the sign-in tab', async () => {
    renderAuthPage();
    expect(await screen.findByRole('tab', { name: 'התחברות' })).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to the register tab and updates the submit label', async () => {
    renderAuthPage();
    await screen.findByRole('tab', { name: 'התחברות' });

    await userEvent.click(screen.getByRole('tab', { name: 'הרשמה' }));

    expect(screen.getByRole('button', { name: 'יצירת חשבון' })).toBeInTheDocument();
  });

  it('shows a Hebrew error message when login fails with invalid credentials', async () => {
    renderAuthPage();
    await screen.findByRole('tab', { name: 'התחברות' });

    vi.stubGlobal('fetch', mockFetchOnce({ ok: false, status: 401, body: { error: 'Invalid email or password' } }));

    await userEvent.type(screen.getByLabelText('אימייל'), 'user@example.com');
    await userEvent.type(screen.getByLabelText('סיסמה'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'התחברות' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('אימייל או סיסמה שגויים.');
  });
});
