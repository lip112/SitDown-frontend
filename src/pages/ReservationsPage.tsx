import { useEffect, useState } from 'react';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import type { PageResponse, ReservationFilter, ReservationSummary } from '../api/types';
import { reservationFilters } from '../data/catalog';
import { formatDateTime, normalizePage, reservationStatusLabel } from '../utils/format';
import { EmptyState } from '../components/EmptyState';
import { ReservationPill } from '../components/StatusPill';

export function ReservationsPage() {
  const { api } = useAuth();
  const [filter, setFilter] = useState<ReservationFilter>('ACTIVE');
  const [page, setPage] = useState<PageResponse<ReservationSummary> | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  async function loadReservations(nextFilter = filter) {
    setLoading(true);
    setMessage('');

    try {
      const response = await api.getMyReservations({ status: nextFilter, page: 0, size: 20 });
      setPage(normalizePage(response));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '예약 목록을 불러오지 못했습니다.');
      setPage(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadReservations(filter);
  }, [filter]);

  async function extendReservation(id: string, minutes: number) {
    try {
      await api.extendReservation(id, minutes);
      await loadReservations();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '예약을 연장하지 못했습니다.');
    }
  }

  async function cancelReservation(id: string) {
    try {
      await api.cancelReservation(id);
      await loadReservations();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '예약을 취소하지 못했습니다.');
    }
  }

  return (
    <section className="page-section">
      <div className="page-heading">
        <p className="eyebrow">My reservations</p>
        <h1>내 예약</h1>
        <p>진행 중인 이용 시간을 확인하고 필요하면 연장하거나 취소하세요.</p>
      </div>

      <div className="segmented-control">
        {reservationFilters.map((item) => (
          <button
            key={item.value}
            type="button"
            className={filter === item.value ? 'is-active' : ''}
            onClick={() => setFilter(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && <p className="form-error inline-message">{message}</p>}
      {loading && <div className="list-skeleton" />}
      {!loading && page?.content.length === 0 && (
        <EmptyState title="예약이 없습니다" body="공간 목록에서 이용할 좌석을 예약해 보세요." />
      )}
      {!loading && page && page.content.length > 0 && (
        <div className="reservation-list">
          {page.content.map((reservation) => (
            <article key={reservation.id} className="reservation-item">
              <div>
                <div className="space-card-topline">
                  <h2>{reservation.spaceName}</h2>
                  <ReservationPill status={reservation.status} />
                </div>
                <p className="muted">{reservation.spaceFloor}층 · {reservation.seatLabel}</p>
                <p className="line-with-icon">
                  <Clock size={16} />
                  {formatDateTime(reservation.startAt)} - {formatDateTime(reservation.endAt)}
                </p>
                {reservation.remainingSeconds !== null && (
                  <p className="muted">남은 시간 {Math.max(Math.floor(reservation.remainingSeconds / 60), 0)}분</p>
                )}
              </div>
              <div className="reservation-actions">
                <span>{reservationStatusLabel(reservation.status)}</span>
                {(reservation.status === 'IN_USE' || reservation.status === 'SCHEDULED') && (
                  <>
                    <button type="button" className="secondary-button" onClick={() => void extendReservation(reservation.id, 30)}>
                      <Plus size={16} />30분 연장
                    </button>
                    <button type="button" className="secondary-button" onClick={() => void cancelReservation(reservation.id)}>
                      <Trash2 size={16} />취소
                    </button>
                  </>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
