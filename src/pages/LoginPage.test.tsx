import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { LoginPage } from './LoginPage';

const { authState, continueAsGuestMock, loginMock } = vi.hoisted(() => ({
  authState: {
    isAuthenticated: false,
    isGuest: false,
  },
  continueAsGuestMock: vi.fn(),
  loginMock: vi.fn(),
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    continueAsGuest: continueAsGuestMock,
    isAuthenticated: authState.isAuthenticated,
    isGuest: authState.isGuest,
    login: loginMock,
  }),
}));

describe('LoginPage', () => {
  beforeEach(() => {
    authState.isAuthenticated = false;
    authState.isGuest = false;
    continueAsGuestMock.mockReset();
    loginMock.mockReset();
  });

  it('offers guest login and sends guests to the spaces page', async () => {
    renderLoginPage();

    fireEvent.click(screen.getByRole('button', { name: '게스트로 둘러보기' }));

    await waitFor(() => {
      expect(continueAsGuestMock).toHaveBeenCalled();
    });
    expect(await screen.findByText('공간 화면')).toBeInTheDocument();
  });

  it('redirects an existing guest session to public space browsing', async () => {
    authState.isAuthenticated = true;
    authState.isGuest = true;

    renderLoginPage();

    expect(await screen.findByText('공간 화면')).toBeInTheDocument();
  });
});

function renderLoginPage() {
  render(
    <MemoryRouter
      initialEntries={['/login']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/spaces" element={<div>공간 화면</div>} />
      </Routes>
    </MemoryRouter>,
  );
}
