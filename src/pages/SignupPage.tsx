import { FormEvent, useState } from 'react';
import { ArrowLeft, MailCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type { Affiliation } from '../api/types';
import { affiliations } from '../data/catalog';

export function SignupPage() {
  const { api } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [verified, setVerified] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [affiliation, setAffiliation] = useState<Affiliation | ''>('UNDERGRADUATE');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function sendCode() {
    setError('');
    try {
      await api.sendEmailCode(email);
      setMessage('인증 코드가 발송되었습니다.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '인증 코드 발송에 실패했습니다.');
    }
  }

  async function verifyCode() {
    setError('');
    try {
      const response = await api.verifyEmailCode(email, code);
      setVerified(response.verified);
      setMessage(response.verified ? '이메일 인증이 완료되었습니다.' : '인증 코드를 다시 확인해 주세요.');
    } catch (err) {
      setError(err instanceof Error ? err.message : '이메일 인증에 실패했습니다.');
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

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
    }
  }

  return (
    <main className="auth-page compact">
      <section className="auth-panel signup-panel">
        <Link to="/login" className="text-link"><ArrowLeft size={16} />로그인으로 돌아가기</Link>
        <div className="auth-panel-head">
          <MailCheck size={28} />
          <div>
            <h1>회원가입</h1>
            <p>이메일 인증 후 계정을 만듭니다.</p>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="form-stack">
          <label>
            이메일
            <div className="inline-field">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <button type="button" className="secondary-button" onClick={() => void sendCode()}>
                발송
              </button>
            </div>
          </label>
          <label>
            인증 코드
            <div className="inline-field">
              <input
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="6자리"
                maxLength={6}
              />
              <button type="button" className="secondary-button" onClick={() => void verifyCode()}>
                확인
              </button>
            </div>
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
          {message && <p className="form-success">{message}</p>}
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary-button" disabled={!verified}>
            가입 완료
          </button>
        </form>
      </section>
    </main>
  );
}
