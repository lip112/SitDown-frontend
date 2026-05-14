import { SearchX } from 'lucide-react';

export function EmptyState({ title, body }: { title: string; body: string }) {
  return (
    <div className="empty-state">
      <SearchX aria-hidden="true" />
      <h2>{title}</h2>
      <p>{body}</p>
    </div>
  );
}
