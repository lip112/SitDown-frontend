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
  const [checkedEmail, setCheckedEmail] = useState('');
  const [emailMessage, setEmailMessage] = useState('');
  const [error, setError] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleCheckEmail() {
    const normalizedEmail = email.trim();
    setError('');
    setEmailMessage('');

    if (!normalizedEmail) {
      setError('이메일을 입력해 주세요.');
      return;
    }

    setCheckingEmail(true);

    try {
      const response = await api.checkEmail(normalizedEmail);
      if (!response.available) {
        setCheckedEmail('');
        setError('이미 가입된 이메일입니다.');
        return;
      }

      setEmail(normalizedEmail);
      setCheckedEmail(normalizedEmail);
      setEmailMessage('사용 가능한 이메일입니다.');
    } catch (err) {
      setCheckedEmail('');
      setError(err instanceof Error ? err.message : '이메일 중복 확인에 실패했습니다.');
    } finally {
      setCheckingEmail(false);
    }
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim();
    if (checkedEmail !== normalizedEmail) {
      setError('이메일 중복 확인을 먼저 해 주세요.');
      return;
    }

    setSubmitting(true);

    try {
      await api.signup({
        email: normalizedEmail,
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
          <div className="form-field">
            <label htmlFor="signup-email">이메일</label>
            <div className="inline-field">
              <input
                id="signup-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setCheckedEmail('');
                  setEmailMessage('');
                }}
                placeholder="student@univ.com"
                required
              />
              <button type="button" className="secondary-button" onClick={() => void handleCheckEmail()} disabled={checkingEmail}>
                {checkingEmail ? '확인 중' : '중복 확인'}
              </button>
            </div>
          </div>
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
          {emailMessage && <p className="form-success">{emailMessage}</p>}
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="primary-button" disabled={submitting}>
            가입 완료
          </button>
        </form>
      </section>
    </main>
  );
}
