import { useEffect, useMemo, useState } from 'react';
import { ArrowRight, Clock, Sparkles, Star, Timer, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type {
  CongestionPredictionResponse,
  PageResponse,
  ReservationSummary,
  SpaceListItemResponse,
} from '../api/types';
import { SpaceCard } from '../components/SpaceCard';
import { ReservationPill } from '../components/StatusPill';
import { formatDateTime, formatMinutes, normalizePage } from '../utils/format';
import { formatSecondsAsClock } from '../utils/reservation';

export function HomePage() {
  const { api, user } = useAuth();
  const [activeReservations, setActiveReservations] = useState<ReservationSummary[]>([]);
  const [recentReservation, setRecentReservation] = useState<ReservationSummary | null>(null);
  const [spaces, setSpaces] = useState<SpaceListItemResponse[]>([]);
  const [congestion, setCongestion] = useState<CongestionPredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadHome() {
      setLoading(true);
      setMessage('');

      try {
        const [activePage, pastPage, spacePage] = await Promise.all([
          api.getMyReservations({ status: 'ACTIVE', page: 0, size: 3 }),
          api.getMyReservations({ status: 'PAST', page: 0, size: 1 }),
          api.getSpaces({ page: 0, size: 4 }),
        ]);
        const active = normalizePage(activePage);
        const past = normalizePage(pastPage);
        const normalizedSpaces = normalizePage(spacePage);
        const firstSpace = normalizedSpaces.content[0];
        const congestionResponse = firstSpace
          ? await api.getCongestion(firstSpace.id).catch(() => null)
          : null;

        if (!cancelled) {
          setActiveReservations(active.content);
          setRecentReservation(past.content[0] ?? null);
          setSpaces(normalizedSpaces.content);
          setCongestion(congestionResponse);
        }
      } catch (err) {
        if (!cancelled) {
          setMessage(err instanceof Error ? err.message : '홈 정보를 불러오지 못했습니다.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadHome();

    return () => {
      cancelled = true;
    };
  }, [api]);

  const recommendedSpace = useMemo(
    () => spaces.find((space) => space.availableSeats > 0) ?? spaces[0],
    [spaces],
  );

  return (
    <section className="page-section home-section">
      <div className="home-hero">
        <div>
          <p className="eyebrow">Today</p>
          <h1>{user?.name ?? '사용자'}님, 오늘 앉을 자리를 골라볼까요?</h1>
          <p>진행 중인 예약과 혼잡도를 먼저 확인하고 빠르게 좌석을 예약하세요.</p>
        </div>
        <Link to="/spaces" className="primary-button">
          빠른 예약 <ArrowRight size={18} />
        </Link>
      </div>

      {message && <p className="form-error inline-message">{message}</p>}
      {loading && <div className="home-skeleton" />}

      {!loading && (
        <>
          <div className="home-grid">
            <section className="home-panel active-reservation-panel">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">Current</p>
                  <h2>내 예약 요약</h2>
                </div>
                <Timer size={22} />
              </div>
              {activeReservations.length > 0 ? (
                activeReservations.map((reservation) => (
                  <article key={reservation.id} className="mini-reservation">
                    <div>
                      <h3>{reservation.spaceName}</h3>
                      <p>{reservation.spaceFloor}층 · {reservation.seatLabel}</p>
                      <span>{formatDateTime(reservation.startAt)} - {formatDateTime(reservation.endAt)}</span>
                    </div>
                    <div>
                      <ReservationPill status={reservation.status} />
                      {reservation.remainingSeconds !== null && (
                        <strong>{formatSecondsAsClock(reservation.remainingSeconds)}</strong>
                      )}
                    </div>
                  </article>
                ))
              ) : (
                <div className="soft-empty">
                  <Sparkles size={20} />
                  <span>진행 중인 예약이 없습니다.</span>
                  <Link to="/spaces">좌석 예약하기</Link>
                </div>
              )}
            </section>

            <section className="home-panel">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">Quick</p>
                  <h2>최근 예약</h2>
                </div>
                <Zap size={22} />
              </div>
              {recentReservation ? (
                <div className="quick-card">
                  <strong>{recentReservation.spaceName}</strong>
                  <span>{recentReservation.seatLabel} · {formatDateTime(recentReservation.startAt)}</span>
                  <Link to="/spaces" className="secondary-button">다시 예약하기</Link>
                </div>
              ) : (
                <div className="quick-card">
                  <strong>최근 예약이 없습니다</strong>
                  <span>공간을 둘러보고 첫 예약을 만들어 보세요.</span>
                  <Link to="/spaces" className="secondary-button">공간 보기</Link>
                </div>
              )}
            </section>
          </div>

          <div className="home-grid lower">
            <section className="home-panel">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">Congestion</p>
                  <h2>대표 공간 혼잡도</h2>
                </div>
                <Clock size={22} />
              </div>
              <div className="home-bar-chart">
                {(congestion?.hourly ?? []).slice(0, 12).map((item) => (
                  <div key={item.hour}>
                    <i style={{ height: `${Math.max(item.occupancyRate * 100, 8)}%` }} />
                    <span>{item.hour}</span>
                  </div>
                ))}
                {congestion?.hourly.length === 0 && <p className="muted">혼잡도 데이터가 없습니다.</p>}
              </div>
            </section>

            <section className="home-panel recommendation-panel">
              <div className="section-title-row">
                <div>
                  <p className="eyebrow">Recommended</p>
                  <h2>추천 공간</h2>
                </div>
                <Star size={22} />
              </div>
              {recommendedSpace ? (
                <SpaceCard space={recommendedSpace} index={0} />
              ) : (
                <div className="soft-empty">
                  <span>추천할 공간 데이터가 없습니다.</span>
                </div>
              )}
            </section>
          </div>
        </>
      )}
    </section>
  );
}
