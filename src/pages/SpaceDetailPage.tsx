import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Heart, MapPin, RefreshCw, Timer, Users } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import type {
  CongestionPredictionResponse,
  SeatItemResponse,
  SeatLayoutResponse,
  SpaceDetailResponse,
} from '../api/types';
import { SeatMap } from '../components/SeatMap';
import { CongestionPill } from '../components/StatusPill';
import { spaceImage } from '../data/catalog';
import {
  categoryLabel,
  formatDate,
  formatMinutes,
  getDefaultDateTimeLocal,
  getOccupancyRate,
  toApiLocalDateTime,
  toKstOffsetDateTime,
} from '../utils/format';
import { getDurationMinutes, validateReservationWindow } from '../utils/reservation';

export function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { api } = useAuth();
  const [space, setSpace] = useState<SpaceDetailResponse | null>(null);
  const [seatLayout, setSeatLayout] = useState<SeatLayoutResponse | null>(null);
  const [congestion, setCongestion] = useState<CongestionPredictionResponse | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<SeatItemResponse | null>(null);
  const [startAt, setStartAt] = useState(() => getDefaultDateTimeLocal(30));
  const [endAt, setEndAt] = useState(() => getDefaultDateTimeLocal(150));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [syncingSeats, setSyncingSeats] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const mainImage = useMemo(() => spaceImage(space?.images?.[0], 0), [space?.images]);

  const refreshSeatLayout = useCallback(async () => {
    if (!id) {
      return;
    }

    const seatsResponse = await api.getSeats(id, toKstOffsetDateTime(startAt));
    setSeatLayout(seatsResponse);
    setSelectedSeat((currentSeat) => {
      if (!currentSeat) {
        return null;
      }

      const nextSeat = seatsResponse.seats.find((seat) => seat.id === currentSeat.id);
      return nextSeat?.status === 'AVAILABLE' ? nextSeat : null;
    });
  }, [api, id, startAt]);

  useEffect(() => {
    if (!id) {
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError('');

    Promise.all([
      api.getSpace(id),
      api.getSeats(id, toKstOffsetDateTime(startAt)),
      api.getCongestion(id),
    ])
      .then(([spaceResponse, seatsResponse, congestionResponse]) => {
        if (!cancelled) {
          setSpace(spaceResponse);
          setSeatLayout(seatsResponse);
          setCongestion(congestionResponse);
          setSelectedSeat(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '공간 정보를 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [api, id, startAt]);

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    function refreshIfVisible() {
      if (document.visibilityState === 'hidden') {
        return;
      }

      void refreshSeatLayout().catch(() => undefined);
    }

    window.addEventListener('focus', refreshIfVisible);
    document.addEventListener('visibilitychange', refreshIfVisible);

    return () => {
      window.removeEventListener('focus', refreshIfVisible);
      document.removeEventListener('visibilitychange', refreshIfVisible);
    };
  }, [id, refreshSeatLayout]);

  async function toggleFavorite() {
    if (!space) {
      return;
    }

    try {
      if (space.isFavorite) {
        await api.removeFavorite(space.id);
      } else {
        await api.addFavorite(space.id);
      }
      setSpace({ ...space, isFavorite: !space.isFavorite });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : '즐겨찾기를 변경하지 못했습니다.');
    }
  }

  async function handleManualSync() {
    setSyncingSeats(true);
    setNotice('');

    try {
      await refreshSeatLayout();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : '좌석 상태를 동기화하지 못했습니다.');
    } finally {
      setSyncingSeats(false);
    }
  }

  async function handleReserve(event: FormEvent) {
    event.preventDefault();
    if (!selectedSeat) {
      setNotice('예약할 좌석을 먼저 선택해 주세요.');
      return;
    }
    if (!space) {
      setNotice('공간 정보를 먼저 불러와 주세요.');
      return;
    }

    const validationError = validateReservationWindow(startAt, endAt, {
      openTime: space.openTime,
      closeTime: space.closeTime,
      maxReservationHours: space.maxReservationHours,
    });
    if (validationError) {
      setNotice(validationError);
      return;
    }

    setSubmitting(true);
    setNotice('');

    try {
      const reservation = await api.createReservation({
        seatId: selectedSeat.id,
        startAt: toApiLocalDateTime(startAt),
        endAt: toApiLocalDateTime(endAt),
      });
      navigate('/reservations/complete', { state: { reservation } });
    } catch (err) {
      setNotice(err instanceof Error ? err.message : '예약에 실패했습니다.');
      if (isConflictError(err)) {
        await refreshSeatLayout().catch(() => undefined);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <section className="page-section"><div className="detail-skeleton" /></section>;
  }

  if (error || !space || !seatLayout) {
    return (
      <section className="page-section">
        <Link to="/spaces" className="text-link">공간 목록으로</Link>
        <div className="empty-state"><h1>공간을 찾을 수 없습니다</h1><p>{error}</p></div>
      </section>
    );
  }

  const occupancy = getOccupancyRate(space.totalSeats, space.availableSeats);
  const durationMinutes = Math.max(getDurationMinutes(startAt, endAt), 0);

  return (
    <section className="page-section detail-section">
      <div className="detail-head">
        <div>
          <Link to="/spaces" className="text-link">공간 목록으로</Link>
          <h1>{space.name}</h1>
          <p className="muted line-with-icon">
            <MapPin size={16} />
            {categoryLabel(space.category)} · {space.floor}층 · {space.openTime.slice(0, 5)}-{space.closeTime.slice(0, 5)}
          </p>
        </div>
        <button type="button" className={`secondary-button ${space.isFavorite ? 'is-favorite' : ''}`} onClick={() => void toggleFavorite()}>
          <Heart size={18} fill={space.isFavorite ? 'currentColor' : 'none'} />
          {space.isFavorite ? '저장됨' : '저장'}
        </button>
      </div>

      <div className="detail-gallery">
        <img src={mainImage} alt="" />
        <div className="gallery-stat">
          <CongestionPill level={space.congestion} />
          <strong>{space.availableSeats}석 가능</strong>
          <span>현재 점유율 {occupancy}%</span>
        </div>
      </div>

      <div className="detail-layout">
        <div className="detail-main">
          <div className="info-row">
            <span><Users size={20} />총 {space.totalSeats}석</span>
            <span><Timer size={20} />최대 {space.maxReservationHours}시간</span>
            <button type="button" className="info-action" onClick={() => void handleManualSync()} disabled={syncingSeats}>
              <RefreshCw size={20} />
              {syncingSeats ? '동기화 중' : '좌석 동기화'}
            </button>
          </div>

          <section className="detail-block">
            <h2>공간 특징</h2>
            <div className="feature-row large">
              {space.features.length > 0 ? space.features.map((feature) => (
                <span key={feature}>{feature}</span>
              )) : <span>등록된 특징 없음</span>}
            </div>
          </section>

          <section className="detail-block">
            <div className="section-title-row">
              <h2>{formatDate(congestion?.date)} 혼잡도 예측</h2>
              <CongestionPill level={space.congestion} />
            </div>
            <div className="bar-chart">
              {(congestion?.hourly ?? []).map((item) => (
                <div key={item.hour} className="bar-item">
                  <span>{item.hour}시</span>
                  <i style={{ height: `${Math.max(item.occupancyRate * 100, 8)}%` }} className={`bar-${item.level.toLowerCase()}`} />
                </div>
              ))}
              {congestion?.hourly.length === 0 && <p className="muted">혼잡도 예측 데이터가 없습니다.</p>}
            </div>
          </section>

          <SeatMap
            rows={seatLayout.rows || space.rows}
            columns={seatLayout.columns || space.columns}
            seats={seatLayout.seats}
            selectedSeatId={selectedSeat?.id}
            onSelectSeat={setSelectedSeat}
          />
        </div>

        <aside className="reservation-card">
          <form onSubmit={handleReserve}>
            <h2>좌석 예약</h2>
            <p className="muted">{selectedSeat ? `${selectedSeat.label} 좌석 선택됨` : '예약 가능한 좌석을 선택하세요.'}</p>
            {selectedSeat && (
              <div className="selected-seat-card">
                <strong>{selectedSeat.label}</strong>
                <span>{selectedSeat.row}행 {selectedSeat.column}열</span>
                <div className="feature-row">
                  {selectedSeat.features.length > 0
                    ? selectedSeat.features.map((feature) => <span key={feature}>{feature}</span>)
                    : <span>좌석 특징 없음</span>}
                </div>
              </div>
            )}
            <label>
              시작 시간
              <input type="datetime-local" value={startAt} onChange={(event) => setStartAt(event.target.value)} required />
            </label>
            <label>
              종료 시간
              <input type="datetime-local" value={endAt} onChange={(event) => setEndAt(event.target.value)} required />
            </label>
            {notice && <p className={notice.includes('완료') ? 'form-success' : 'form-error'}>{notice}</p>}
            <button type="submit" className="primary-button full" disabled={submitting || !selectedSeat}>
              예약하기
            </button>
          </form>
          <div className="reservation-note">
            <span>운영 시간</span>
            <strong>{space.openTime.slice(0, 5)}-{space.closeTime.slice(0, 5)}</strong>
          </div>
          <div className="reservation-note">
            <span>이용 시간</span>
            <strong>{formatMinutes(durationMinutes)}</strong>
          </div>
        </aside>
      </div>
    </section>
  );
}

function isConflictError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && 'status' in error
    && (error as { status?: unknown }).status === 409;
}
