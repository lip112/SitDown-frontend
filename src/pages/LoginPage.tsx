import { FormEvent, useEffect, useState } from 'react';
import { ArrowRight, Building2, Eye, ShieldCheck } from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function LoginPage() {
  const { continueAsGuest, login, isAuthenticated, isGuest } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/home';

  useEffect(() => {
    if (isAuthenticated) {
      navigate(isGuest ? publicGuestDestination(from) : from, { replace: true });
    }
  }, [from, isAuthenticated, isGuest, navigate]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await login(email, password);
      navigate(from, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  function handleGuestLogin() {
    continueAsGuest();
    navigate(publicGuestDestination(from), { replace: true });
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="brand large">
          <span className="brand-mark">S</span>
          <span>UNIV SITDOWN</span>
        </div>
        <h1>오늘 앉을 자리를 먼저 고르세요.</h1>
        <p>열람실, 스터디룸, PC실 좌석을 한 화면에서 확인하고 바로 예약합니다.</p>
        <div className="auth-photo-grid" aria-hidden="true">
          <img src="https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=900&q=80" alt="" />
          <img src="https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=900&q=80" alt="" />
        </div>
      </section>
      <section className="auth-panel">
        <div className="auth-panel-head">
          <Building2 size={28} />
          <div>
            <h2>UNIV SITDOWN</h2>
            <p>학교 계정으로 로그인</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            이메일
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="student@univ.com"
              required
            />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="8자 이상"
              required
            />
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting}>
            로그인 <ArrowRight size={18} />
          </button>
        </form>
        <button type="button" className="secondary-button full guest-login-button" onClick={handleGuestLogin}>
          <Eye size={18} />
          게스트로 둘러보기
        </button>
        <div className="auth-bottom">
          <span><ShieldCheck size={16} />JWT 인증으로 연결됩니다.</span>
          <Link to="/signup">회원가입</Link>
        </div>
      </section>
    </main>
  );
}

function publicGuestDestination(path: string): string {
  return path.startsWith('/spaces') || path.startsWith('/notices') ? path : '/spaces';
}
