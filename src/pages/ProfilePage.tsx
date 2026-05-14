import { FormEvent, useEffect, useState } from 'react';
import { BarChart3, TrendingUp, UserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import type { Affiliation, StatResponse, UserResponse } from '../api/types';
import { affiliations } from '../data/catalog';
import { affiliationLabel, formatMinutes } from '../utils/format';

export function ProfilePage() {
  const { api, user: authUser, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserResponse | null>(null);
  const [stat, setStat] = useState<StatResponse | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [affiliation, setAffiliation] = useState<Affiliation | ''>('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([api.getMe(), api.getStats('WEEKLY')])
      .then(([profileResponse, statResponse]) => {
        if (!cancelled) {
          setProfile(profileResponse);
          setStat(statResponse);
          setName(profileResponse.name);
          setPhone(profileResponse.phone ?? '');
          setAffiliation(profileResponse.affiliation ?? '');
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage(err instanceof Error ? err.message : '내 정보를 불러오지 못했습니다.');
        }
      });

    return () => {
      cancelled = true;
    };
  }, [api]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage('');

    try {
      const response = await api.updateMe({ name, phone, affiliation });
      setProfile(response);
      await refreshUser();
      setMessage('내 정보가 저장되었습니다.');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '내 정보를 저장하지 못했습니다.');
    }
  }

  const maxMinutes = Math.max(...(stat?.daily.map((item) => item.minutes) ?? [1]), 1);

  return (
    <section className="page-section profile-grid">
      <div className="profile-card">
        <div className="avatar">
          {profile?.profileImageUrl ? <img src={profile.profileImageUrl} alt="" /> : <UserRound size={32} />}
        </div>
        <h1>{profile?.name ?? authUser?.name ?? '사용자'}</h1>
        <p>{profile?.email ?? authUser?.email}</p>
        <span className="pill pill-neutral">{affiliationLabel(profile?.affiliation)}</span>
      </div>

      <form className="settings-panel form-stack" onSubmit={handleSubmit}>
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Profile</p>
            <h2>내 정보 수정</h2>
          </div>
        </div>
        <label>
          이름
          <input value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <label>
          전화번호
          <input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="010-1234-5678" />
        </label>
        <label>
          소속
          <select value={affiliation} onChange={(event) => setAffiliation(event.target.value as Affiliation | '')}>
            {affiliations.map((item) => (
              <option key={item.value || 'none'} value={item.value}>{item.label}</option>
            ))}
          </select>
        </label>
        {message && <p className={message.includes('저장') ? 'form-success' : 'form-error'}>{message}</p>}
        <button type="submit" className="primary-button">저장</button>
      </form>

      <section className="stats-panel">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Weekly stats</p>
            <h2>이번 주 이용</h2>
          </div>
          <BarChart3 size={24} />
        </div>
        <div className="stats-total">
          <strong>{formatMinutes(stat?.totalMinutes ?? 0)}</strong>
          <span><TrendingUp size={16} />지난 기간 대비 {formatMinutes(Math.abs(stat?.comparedToPreviousMinutes ?? 0))}</span>
        </div>
        <div className="mini-chart">
          {(stat?.daily ?? []).map((item) => (
            <div key={item.date} className="mini-chart-item">
              <i style={{ height: `${Math.max((item.minutes / maxMinutes) * 100, 8)}%` }} />
              <span>{item.date.slice(5)}</span>
            </div>
          ))}
        </div>
        <div className="top-spaces">
          {(stat?.topSpaces ?? []).slice(0, 3).map((item) => (
            <div key={item.spaceId}>
              <span>{item.spaceName}</span>
              <strong>{formatMinutes(item.minutes)}</strong>
            </div>
          ))}
        </div>
      </section>
    </section>
  );
}
