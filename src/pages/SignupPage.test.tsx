import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SignupPage } from './SignupPage';

const { checkEmailMock, signupMock } = vi.hoisted(() => ({
  checkEmailMock: vi.fn(),
  signupMock: vi.fn(),
}));

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    api: {
      checkEmail: checkEmailMock,
      signup: signupMock,
    },
  }),
}));

describe('SignupPage', () => {
  beforeEach(() => {
    checkEmailMock.mockReset();
    signupMock.mockReset();
  });

  it('uses email duplicate check instead of legacy email verification', () => {
    renderSignupPage();

    expect(screen.getByText('이메일 중복 확인 후 계정을 만듭니다.')).toBeInTheDocument();
    expect(screen.queryByLabelText('인증 코드')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: '발송' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '중복 확인' })).toBeInTheDocument();
  });

  it('requires email duplicate check before signup', async () => {
    renderSignupPage();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'student@univ.com' } });
    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '김학생' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'P@ssw0rd1!' } });
    fireEvent.change(screen.getByLabelText('전화번호'), { target: { value: '010-1234-5678' } });
    fireEvent.click(screen.getByRole('button', { name: '가입 완료' }));

    expect(await screen.findByText('이메일 중복 확인을 먼저 해 주세요.')).toBeInTheDocument();
    expect(signupMock).not.toHaveBeenCalled();
  });

  it('checks email availability before submitting signup', async () => {
    checkEmailMock.mockResolvedValueOnce({ email: 'student@univ.com', available: true });
    renderSignupPage();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'student@univ.com' } });
    fireEvent.click(screen.getByRole('button', { name: '중복 확인' }));

    expect(await screen.findByText('사용 가능한 이메일입니다.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('이름'), { target: { value: '김학생' } });
    fireEvent.change(screen.getByLabelText('비밀번호'), { target: { value: 'P@ssw0rd1!' } });
    fireEvent.change(screen.getByLabelText('전화번호'), { target: { value: '010-1234-5678' } });
    fireEvent.click(screen.getByRole('button', { name: '가입 완료' }));

    await waitFor(() => {
      expect(checkEmailMock).toHaveBeenCalledWith('student@univ.com');
      expect(signupMock).toHaveBeenCalledWith({
        email: 'student@univ.com',
        password: 'P@ssw0rd1!',
        name: '김학생',
        phone: '010-1234-5678',
        affiliation: 'UNDERGRADUATE',
      });
    });
  });

  it('shows duplicate email errors from email check', async () => {
    checkEmailMock.mockRejectedValueOnce(new Error('이미 가입된 이메일입니다.'));
    renderSignupPage();

    fireEvent.change(screen.getByLabelText('이메일'), { target: { value: 'student@univ.com' } });
    fireEvent.click(screen.getByRole('button', { name: '중복 확인' }));

    expect(await screen.findByText('이미 가입된 이메일입니다.')).toBeInTheDocument();
    expect(signupMock).not.toHaveBeenCalled();
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
