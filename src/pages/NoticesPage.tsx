import { useEffect, useState } from 'react';
import { Bell, ChevronRight } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import type { NoticeCategory, NoticeDetailResponse, NoticeListItemResponse, PageResponse } from '../api/types';
import { noticeCategories } from '../data/catalog';
import { formatDate, normalizePage, noticeCategoryLabel } from '../utils/format';
import { EmptyState } from '../components/EmptyState';

export function NoticesPage() {
  const { api } = useAuth();
  const [category, setCategory] = useState<NoticeCategory>('ALL');
  const [page, setPage] = useState<PageResponse<NoticeListItemResponse> | null>(null);
  const [selected, setSelected] = useState<NoticeDetailResponse | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;
    setMessage('');

    api.getNotices({ category, page: 0, size: 20 })
      .then((response) => {
        if (!cancelled) {
          setPage(normalizePage(response));
          setSelected(null);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage(err instanceof Error ? err.message : '공지사항을 불러오지 못했습니다.');
          setPage(null);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [api, category]);

  async function openNotice(id: string) {
    try {
      setSelected(await api.getNotice(id));
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '공지사항을 열 수 없습니다.');
    }
  }

  return (
    <section className="page-section notice-layout">
      <div className="page-heading">
        <p className="eyebrow">Notice</p>
        <h1>공지사항</h1>
        <p>운영 시간 변경, 점검, 이벤트 소식을 확인하세요.</p>
      </div>

      <div className="segmented-control">
        {noticeCategories.map((item) => (
          <button
            key={item.value}
            type="button"
            className={category === item.value ? 'is-active' : ''}
            onClick={() => setCategory(item.value)}
          >
            {item.label}
          </button>
        ))}
      </div>

      {message && <p className="form-error inline-message">{message}</p>}

      <div className="notice-grid">
        <div className="notice-list">
          {page?.content.map((notice) => (
            <button key={notice.id} type="button" className="notice-item" onClick={() => void openNotice(notice.id)}>
              <span className="notice-icon"><Bell size={18} /></span>
              <span>
                <strong>{notice.title}</strong>
                <small>{noticeCategoryLabel(notice.category)} · {formatDate(notice.publishedAt)}</small>
              </span>
              {notice.isNew && <i>NEW</i>}
              <ChevronRight size={18} />
            </button>
          ))}
          {page?.content.length === 0 && <EmptyState title="공지사항이 없습니다" body="선택한 카테고리에 등록된 공지가 없습니다." />}
        </div>

        <article className="notice-detail">
          {selected ? (
            <>
              <span className="pill pill-neutral">{noticeCategoryLabel(selected.category)}</span>
              <h2>{selected.title}</h2>
              <p className="muted">{formatDate(selected.publishedAt)}</p>
              <div className="notice-content">{selected.content}</div>
            </>
          ) : (
            <div className="empty-state">
              <Bell />
              <h2>공지 선택</h2>
              <p>왼쪽 목록에서 자세히 볼 공지를 선택하세요.</p>
            </div>
          )}
        </article>
      </div>
    </section>
  );
}
