import { FormEvent, useState } from 'react';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Affiliation } from '../api/types';
import { affiliations } from '../data/catalog';

export function SignupPage() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [affiliation, setAffiliation] = useState<Affiliation | ''>('UNDERGRADUATE');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await api.signup({
        email,
        password,
        name,
        phone: phone || undefined,
        affiliation: affiliation || undefined,
      });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : '회원가입에 실패했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="auth-page compact">
      <section className="auth-panel signup-panel">
        <Link to="/login" className="text-link"><ArrowLeft size={16} />로그인으로 돌아가기</Link>
        <div className="auth-panel-head">
          <UserPlus size={28} />
          <div>
            <h1>회원가입</h1>
            <p>이메일 중복 확인 후 계정을 만듭니다.</p>
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
            이름
            <input value={name} onChange={(event) => setName(event.target.value)} required />
          </label>
          <label>
            비밀번호
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          <label>
            전화번호
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="010-1234-5678"
            />
          </label>
          <label>
            소속
            <select value={affiliation} onChange={(event) => setAffiliation(event.target.value as Affiliation | '')}>
              {affiliations.map((item) => (
                <option key={item.value || 'none'} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting}>
            가입 완료
          </button>
        </form>
      </section>
    </main>
  );
}
