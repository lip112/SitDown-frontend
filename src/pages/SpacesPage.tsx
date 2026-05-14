import { FormEvent, useEffect, useState } from 'react';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import type { PageResponse, SpaceCategory, SpaceListItemResponse } from '../api/types';
import { spaceCategories } from '../data/catalog';
import { normalizePage } from '../utils/format';
import { EmptyState } from '../components/EmptyState';
import { SpaceCard } from '../components/SpaceCard';

export function SpacesPage() {
  const { api } = useAuth();
  const [category, setCategory] = useState<SpaceCategory | ''>('');
  const [keywordInput, setKeywordInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState<PageResponse<SpaceListItemResponse> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api.getSpaces({ category, keyword, page: 0, size: 24 })
      .then((response) => {
        if (!cancelled) {
          setPage(normalizePage(response));
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : '공간 목록을 불러오지 못했습니다.');
          setPage(null);
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
  }, [api, category, keyword]);

  function handleSearch(event: FormEvent) {
    event.preventDefault();
    setKeyword(keywordInput.trim());
  }

  return (
    <section className="page-section">
      <div className="page-hero">
        <div>
          <p className="eyebrow">Seat marketplace</p>
          <h1>오늘 이용할 캠퍼스 공간</h1>
          <p>혼잡도와 좌석 수를 보고 바로 예약할 수 있는 공간을 고르세요.</p>
        </div>
        <form className="search-bar-pill" onSubmit={handleSearch}>
          <label>
            <span>Where</span>
            <input
              value={keywordInput}
              onChange={(event) => setKeywordInput(event.target.value)}
              placeholder="공간명 검색"
            />
          </label>
          <label>
            <span>Category</span>
            <select value={category} onChange={(event) => setCategory(event.target.value as SpaceCategory | '')}>
              {spaceCategories.map((item) => (
                <option key={item.value || 'all'} value={item.value}>{item.label}</option>
              ))}
            </select>
          </label>
          <button type="submit" className="search-orb" aria-label="검색">
            <Search size={21} />
          </button>
        </form>
      </div>

      <div className="category-strip" aria-label="공간 카테고리">
        {spaceCategories.map((item) => (
          <button
            key={item.value || 'all'}
            type="button"
            className={category === item.value ? 'is-active' : ''}
            onClick={() => setCategory(item.value)}
          >
            <SlidersHorizontal size={17} />
            <span>{item.label}</span>
            <small>{item.hint}</small>
          </button>
        ))}
      </div>

      {loading && <div className="grid-skeleton" aria-label="공간 목록 로딩 중" />}
      {error && <EmptyState title="공간을 불러오지 못했습니다" body={error} />}
      {!loading && !error && page?.content.length === 0 && (
        <EmptyState title="조건에 맞는 공간이 없습니다" body="검색어를 줄이거나 다른 카테고리를 선택해 보세요." />
      )}
      {!loading && !error && page && page.content.length > 0 && (
        <div className="space-grid">
          {page.content.map((space, index) => (
            <SpaceCard key={space.id} space={space} index={index} />
          ))}
        </div>
      )}
    </section>
  );
}
