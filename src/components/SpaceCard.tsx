import { Heart, MapPin, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { SpaceListItemResponse } from '../api/types';
import { spaceImage } from '../data/catalog';
import { categoryLabel, getOccupancyRate } from '../utils/format';
import { CongestionPill } from './StatusPill';

interface SpaceCardProps {
  space: SpaceListItemResponse;
  index: number;
}

export function SpaceCard({ space, index }: SpaceCardProps) {
  const occupancy = getOccupancyRate(space.totalSeats, space.availableSeats);

  return (
    <Link to={`/spaces/${space.id}`} className="space-card">
      <div className="space-photo">
        <img src={spaceImage(space.thumbnailUrl, index)} alt="" />
        <span className="guest-badge">{categoryLabel(space.category)}</span>
        <span className="photo-heart" aria-hidden="true">
          <Heart size={18} />
        </span>
      </div>
      <div className="space-card-body">
        <div className="space-card-topline">
          <h2>{space.name}</h2>
          <CongestionPill level={space.congestion} />
        </div>
        <p className="muted line-with-icon">
          <MapPin size={15} />
          {space.floor}층 · {space.openTime.slice(0, 5)}-{space.closeTime.slice(0, 5)}
        </p>
        <p className="muted line-with-icon">
          <Users size={15} />
          {space.availableSeats}/{space.totalSeats}석 가능 · 점유율 {occupancy}%
        </p>
        <div className="feature-row">
          {space.features.slice(0, 3).map((feature) => (
            <span key={feature}>{feature}</span>
          ))}
        </div>
      </div>
    </Link>
  );
}
