import { Bell, CalendarDays, DoorOpen, LogOut, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { API_BASE_URL } from '../config/env';

export function Layout() {
  const { logout, user } = useAuth();

  return (
    <div className="app-shell">
      <header className="top-nav">
        <NavLink to="/spaces" className="brand" aria-label="UNIV SITDOWN 홈">
          <span className="brand-mark">S</span>
          <span>UNIV SITDOWN</span>
        </NavLink>
        <nav className="nav-links" aria-label="주요 메뉴">
          <NavLink to="/spaces"><DoorOpen size={18} />공간</NavLink>
          <NavLink to="/reservations"><CalendarDays size={18} />예약</NavLink>
          <NavLink to="/notices"><Bell size={18} />공지</NavLink>
          <NavLink to="/profile"><UserRound size={18} />내 정보</NavLink>
        </nav>
        <div className="nav-user">
          <span>{user?.name ?? '사용자'}</span>
          <button type="button" className="icon-button" onClick={() => void logout()} aria-label="로그아웃">
            <LogOut size={18} />
          </button>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
      <footer className="footer-light">
        <div>
          <strong>UNIV SITDOWN</strong>
          <span>캠퍼스 좌석 예약을 빠르게 확인하고 안전하게 예약하세요.</span>
        </div>
        <span>API: {API_BASE_URL}</span>
      </footer>
    </div>
  );
}
