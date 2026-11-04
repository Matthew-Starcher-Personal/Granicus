import type { RefCallback, RefObject } from 'react';
import type { Park } from '../data/types';

type Props = {
  parks: Park[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  buttonRef: (id: string) => RefCallback<HTMLButtonElement>;
  headingRef?: RefObject<HTMLHeadingElement>;
};

export function ParkList({ parks, selectedId, onSelect, buttonRef, headingRef }: Props) {
  const countLabel = `${parks.length} ${parks.length === 1 ? 'park' : 'parks'}`;

  return (
    <div className="park-list">
      <h2 ref={headingRef} tabIndex={-1}>
        Parks
      </h2>
      <p className="park-list__count">{countLabel}</p>
      <ul aria-label={countLabel}>
        {parks.map((park) => (
          <li key={park.id}>
            <button
              type="button"
              ref={buttonRef(park.id)}
              className="park-list__item"
              aria-current={park.id === selectedId ? 'true' : undefined}
              onClick={() => onSelect(park.id)}
            >
              <span className="park-list__name">{park.name}</span>
              {park.address && <span className="park-list__address">{park.address}</span>}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
