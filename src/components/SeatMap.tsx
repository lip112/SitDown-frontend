import type { SeatItemResponse } from '../api/types';

interface SeatMapProps {
  rows: number;
  columns: number;
  seats: SeatItemResponse[];
  selectedSeatId?: string;
  onSelectSeat: (seat: SeatItemResponse) => void;
}

export function SeatMap({ rows, columns, seats, selectedSeatId, onSelectSeat }: SeatMapProps) {
  const seatByPosition = new Map(seats.map((seat) => [`${seat.row}:${seat.column}`, seat]));

  return (
    <div className="seat-map-shell">
      <div className="seat-map-head">
        <span>좌석 배치</span>
        <div className="seat-legend">
          <span><i className="seat-dot available" />가능</span>
          <span><i className="seat-dot reserved" />예약</span>
          <span><i className="seat-dot occupied" />사용 중</span>
        </div>
      </div>
      <div
        className="seat-map"
        style={{
          gridTemplateColumns: `repeat(${Math.max(columns, 1)}, minmax(36px, 1fr))`,
        }}
      >
        {Array.from({ length: Math.max(rows, 1) }).flatMap((_, rowIndex) =>
          Array.from({ length: Math.max(columns, 1) }).map((__, columnIndex) => {
            const seat = seatByPosition.get(`${rowIndex + 1}:${columnIndex + 1}`);
            if (!seat) {
              return <span key={`${rowIndex}:${columnIndex}`} className="seat-cell seat-empty" />;
            }

            const isAvailable = seat.status === 'AVAILABLE';
            const isSelected = seat.id === selectedSeatId;

            return (
              <button
                key={seat.id}
                type="button"
                className={`seat-cell seat-${seat.status.toLowerCase()} ${isSelected ? 'is-selected' : ''}`}
                disabled={!isAvailable}
                onClick={() => onSelectSeat(seat)}
                title={`${seat.label} · ${seat.status}`}
              >
                {seat.label}
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
