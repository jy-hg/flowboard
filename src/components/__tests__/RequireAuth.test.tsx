import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

const auth = vi.hoisted(() => ({ value: { session: null as unknown, loading: false } }));
vi.mock('../../lib/AuthContext', () => ({ useAuth: () => auth.value }));

import { RequireAuth } from '../RequireAuth';

function renderAt() {
  render(
    <MemoryRouter initialEntries={['/boards']}>
      <Routes>
        <Route path="/" element={<p>login page</p>} />
        <Route path="/boards" element={<RequireAuth><p>secret boards</p></RequireAuth>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth (audit: route protection)', () => {
  it('redirects to the login page without a session', () => {
    auth.value = { session: null, loading: false };
    renderAt();
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('secret boards')).not.toBeInTheDocument();
  });

  it('shows a status message, and no content or redirect, while loading', () => {
    auth.value = { session: null, loading: true };
    renderAt();
    expect(screen.getByRole('status')).toHaveTextContent('Loading…');
    expect(screen.queryByText('login page')).not.toBeInTheDocument();
  });

  it('renders children with a session', () => {
    auth.value = { session: { user: { id: 'u1' } }, loading: false };
    renderAt();
    expect(screen.getByText('secret boards')).toBeInTheDocument();
  });
});
