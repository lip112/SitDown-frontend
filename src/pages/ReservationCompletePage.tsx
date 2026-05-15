import { CalendarCheck, Clock, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { CreateReservationResponse } from '../api/types';
import { formatDateTime, formatMinutes } from '../utils/format';

export function ReservationCompletePage() {
  const location = useLocation();
  const reservation = (location.state as { reservation?: CreateReservationResponse } | null)?.reservation;

  return (
    <section className="page-section complete-section">
      <div className="complete-card">
        <span className="complete-icon"><CalendarCheck size={34} /></span>
        <p className="eyebrow">Reservation complete</p>
        <h1>예약이 완료되었습니다</h1>
        {reservation ? (
          <div className="complete-summary">
            <strong>{reservation.spaceName}</strong>
            <span className="line-with-icon"><MapPin size={16} />{reservation.seatLabel}</span>
            <span className="line-with-icon">
              <Clock size={16} />
              {formatDateTime(reservation.startAt)} - {formatDateTime(reservation.endAt)}
            </span>
            <span>이용 시간 {formatMinutes(reservation.durationHours * 60)}</span>
          </div>
        ) : (
          <p className="muted">방금 생성한 예약 정보가 없으면 내 예약에서 최신 상태를 확인하세요.</p>
        )}
        <div className="complete-actions">
          <Link to="/home" className="secondary-button">홈으로</Link>
          <Link to="/reservations" className="primary-button">예약 내역 보기</Link>
        </div>
      </div>
    </section>
  );
}
