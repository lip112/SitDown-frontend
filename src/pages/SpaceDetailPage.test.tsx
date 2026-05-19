import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type {
  CongestionPredictionResponse,
  SeatLayoutResponse,
  SpaceDetailResponse,
} from '../api/types';
import { SpaceDetailPage } from './SpaceDetailPage';

const {
  addFavoriteMock,
  apiMock,
  createReservationMock,
  getCongestionMock,
  getSeatsMock,
  getSpaceMock,
  removeFavoriteMock,
} = vi.hoisted(() => ({
  addFavoriteMock: vi.fn(),
  createReservationMock: vi.fn(),
  getCongestionMock: vi.fn(),
  getSeatsMock: vi.fn(),
  getSpaceMock: vi.fn(),
  removeFavoriteMock: vi.fn(),
  apiMock: {
    addFavorite: vi.fn(),
    createReservation: vi.fn(),
    getCongestion: vi.fn(),
    getSeats: vi.fn(),
    getSpace: vi.fn(),
    removeFavorite: vi.fn(),
  },
}));

apiMock.addFavorite = addFavoriteMock;
apiMock.createReservation = createReservationMock;
apiMock.getCongestion = getCongestionMock;
apiMock.getSeats = getSeatsMock;
apiMock.getSpace = getSpaceMock;
apiMock.removeFavorite = removeFavoriteMock;

vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    api: apiMock,
  }),
}));

describe('SpaceDetailPage', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    addFavoriteMock.mockReset();
    createReservationMock.mockReset();
    getCongestionMock.mockReset();
    getSeatsMock.mockReset();
    getSpaceMock.mockReset();
    removeFavoriteMock.mockReset();

    getSpaceMock.mockResolvedValue(spaceDetail);
    getCongestionMock.mockResolvedValue(congestion);
  });

  it('refreshes seat status when the page regains focus', async () => {
    getSeatsMock
      .mockResolvedValueOnce(seatLayout('AVAILABLE'))
      .mockResolvedValueOnce(seatLayout('RESERVED'));
    renderSpaceDetailPage();

    expect(await screen.findByRole('button', { name: 'A01' })).toBeEnabled();

    fireEvent(window, new Event('focus'));

    await waitFor(() => {
      expect(getSeatsMock).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByRole('button', { name: 'A01' })).toBeDisabled();
  });

  it('refreshes seat status after a reservation conflict', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date('2026-05-19T09:00:00+09:00'));
    getSeatsMock
      .mockResolvedValueOnce(seatLayout('AVAILABLE'))
      .mockResolvedValueOnce(seatLayout('RESERVED'));
    createReservationMock.mockRejectedValueOnce(Object.assign(new Error('이미 예약된 좌석입니다.'), { status: 409 }));
    renderSpaceDetailPage();

    fireEvent.click(await screen.findByRole('button', { name: 'A01' }));
    fireEvent.click(screen.getByRole('button', { name: '예약하기' }));

    expect(await screen.findByText('이미 예약된 좌석입니다.')).toBeInTheDocument();
    await waitFor(() => {
      expect(getSeatsMock).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByRole('button', { name: 'A01' })).toBeDisabled();
  });
});

function renderSpaceDetailPage() {
  render(
    <MemoryRouter
      initialEntries={['/spaces/space-1']}
      future={{ v7_relativeSplatPath: true, v7_startTransition: true }}
    >
      <Routes>
        <Route path="/spaces/:id" element={<SpaceDetailPage />} />
        <Route path="/reservations/complete" element={<div>예약 완료</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

function seatLayout(status: 'AVAILABLE' | 'RESERVED'): SeatLayoutResponse {
  return {
    spaceId: 'space-1',
    rows: 1,
    columns: 1,
    seats: [
      {
        id: 'seat-a01',
        label: 'A01',
        row: 1,
        column: 1,
        status,
        features: [],
      },
    ],
  };
}

const spaceDetail: SpaceDetailResponse = {
  id: 'space-1',
  name: '제1열람실',
  floor: 1,
  category: 'READING_ROOM',
  totalSeats: 1,
  availableSeats: 1,
  congestion: 'LOW',
  openTime: '09:00:00',
  closeTime: '22:00:00',
  features: [],
  rows: 1,
  columns: 1,
  maxReservationHours: 4,
  images: [],
  isFavorite: false,
};

const congestion: CongestionPredictionResponse = {
  spaceId: 'space-1',
  date: '2026-05-19',
  hourly: [],
};
