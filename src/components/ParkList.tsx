import type { Park } from '../data/types';

type Props = {
  parks: Park[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  registerButton: (id: string, el: HTMLButtonElement | null) => void;
};

export function ParkList({ parks, selectedId, onSelect, registerButton }: Props) {
  const countLabel = `${parks.length} ${parks.length === 1 ? 'park' : 'parks'}`;

  return (
    <div className="park-list">
      <h2 id="park-list-heading" tabIndex={-1}>
        Parks
      </h2>
      <p className="park-list__count">{countLabel}</p>
      <ul aria-label={countLabel}>
        {parks.map((park) => (
          <li key={park.id}>
            <button
              type="button"
              ref={(el) => registerButton(park.id, el)}
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
