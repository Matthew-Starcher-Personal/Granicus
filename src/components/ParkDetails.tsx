import { useEffect, useId, useRef, type RefObject } from 'react';
import type { Park } from '../data/types';
import { ParkImages } from './ParkImages';

type Props = {
  park: Park;
  onBack: () => void;
  headingRef?: RefObject<HTMLHeadingElement>;
};

function formatAcreage(acreage: number): string {
  const rounded = Math.round(acreage * 10) / 10;
  if (rounded === 0) return '<0.1 acres';
  return `${rounded.toLocaleString('en-US')} ${rounded === 1 ? 'acre' : 'acres'}`;
}

function formatRating(rating: number): string {
  return rating.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

export function ParkDetails({ park, onBack, headingRef: outerHeadingRef }: Props) {
  const ownHeadingRef = useRef<HTMLHeadingElement>(null);
  const headingRef = outerHeadingRef ?? ownHeadingRef;
  const headingId = useId();
  const amenitiesHeadingId = useId();

  useEffect(() => {
    headingRef.current?.focus();
  }, [park.id, headingRef]);

  const facts: { term: string; value: string }[] = [];
  if (park.address) facts.push({ term: 'Address', value: park.address });
  if (park.hours) facts.push({ term: 'Hours', value: park.hours });
  if (park.acreage !== null) facts.push({ term: 'Size', value: formatAcreage(park.acreage) });
  if (park.rating !== null) facts.push({ term: 'Rating', value: formatRating(park.rating) });

  return (
    <article className="park-details" aria-labelledby={headingId}>
      <button type="button" className="back-button" onClick={onBack}>
        <span aria-hidden="true">←</span> Back to all parks
      </button>
      <h2 id={headingId} ref={headingRef} tabIndex={-1}>
        {park.name}
      </h2>
      {park.description && <p className="park-details__description">{park.description}</p>}
      {facts.length > 0 && (
        <dl className="park-details__facts">
          {facts.map((fact) => (
            <div key={fact.term}>
              <dt>{fact.term}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>
      )}
      {park.amenities.length > 0 && (
        <section aria-labelledby={amenitiesHeadingId}>
          <h3 id={amenitiesHeadingId}>Amenities</h3>
          <ul className="tags">
            {park.amenities.map((amenity) => (
              <li key={amenity.slug}>{amenity.label}</li>
            ))}
          </ul>
        </section>
      )}
      <ParkImages key={park.id} images={park.images} parkName={park.name} />
    </article>
  );
}
