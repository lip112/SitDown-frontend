import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignupPage } from './SignupPage';

const { signupMock } = vi.hoisted(() => ({
  signupMock: vi.fn(),
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    api: {
      signup: signupMock,
    },
  }),
}));

describe('SignupPage', () => {
  beforeEach(() => {
    signupMock.mockReset();
  });

  it('does not require legacy email verification before signup', () => {
    renderSignupPage();

    expect(screen.getByText('이메일 중복 확인 후 계정을 만듭니다.')).toBeInTheDocument();
    expect(screen.queryByLabelText('인증 코드')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '발송' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '가입 완료' })).toBeEnabled();
  });

  it('submits signup directly and shows duplicate email errors from the backend', async () => {
    signupMock.mockRejectedValueOnce(new Error('이미 가입된 이메일입니다.'));
    renderSignupPage();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'student@univ.com' } });
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '김학생' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'P@ssw0rd1!' } });
    fireEvent.change(screen.getByLabelText('전화번호'), { target: { value: '010-1234-5678' } });
    fireEvent.click(screen.getByRole('button', { name: '가입 완료' }));

    await waitFor(() => {
      expect(signupMock).toHaveBeenCalledWith({
        email: 'student@univ.com',
        password: 'P@ssw0rd1!',
        name: '김학생',
        phone: '010-1234-5678',
        affiliation: 'UNDERGRADUATE',
      });
    });
    expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeInTheDocument();
  });
});

function renderSignupPage() {
  render(
    <MemoryRouter
      initialEntries={['/signup']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/login" element={<div>로그인 화면</div>} />
      </Routes>
    </MemoryRouter>,
  );
}
