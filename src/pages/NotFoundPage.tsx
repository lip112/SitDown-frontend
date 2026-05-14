import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <section className="page-section">
      <div className="empty-state">
        <h1>페이지를 찾을 수 없습니다</h1>
        <p>주소를 다시 확인하거나 공간 목록으로 이동하세요.</p>
        <Link to="/spaces" className="primary-button">공간 목록으로</Link>
      </div>
    </section>
  );
}
