import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Heart, MapPin, RefreshCw, Timer, Users } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
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
  getDefaultDateTimeLocal,
  getOccupancyRate,
  toApiLocalDateTime,
  toKstOffsetDateTime,
} from '../utils/format';

export function SpaceDetailPage() {
  const { id } = useParams<{ id: string }>();
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
  const [submitting, setSubmitting] = useState(false);

  const mainImage = useMemo(() => spaceImage(space?.images?.[0], 0), [space?.images]);

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

  async function handleReserve(event: FormEvent) {
    event.preventDefault();
    if (!selectedSeat) {
      setNotice('예약할 좌석을 먼저 선택해 주세요.');
      return;
    }

    setSubmitting(true);
    setNotice('');

    try {
      await api.createReservation({
        seatId: selectedSeat.id,
        startAt: toApiLocalDateTime(startAt),
        endAt: toApiLocalDateTime(endAt),
      });
      setNotice(`${selectedSeat.label} 좌석 예약이 완료되었습니다.`);
      if (id) {
        setSeatLayout(await api.getSeats(id, toKstOffsetDateTime(startAt)));
      }
      setSelectedSeat(null);
    } catch (err) {
      setNotice(err instanceof Error ? err.message : '예약에 실패했습니다.');
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
            <span><RefreshCw size={20} />실시간 좌석 반영</span>
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
        </aside>
      </div>
    </section>
  );
}
