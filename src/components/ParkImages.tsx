import { useState } from 'react';
import type { ParkImage } from '../data/types';

type Props = { images: ParkImage[] };

type LoadStatus = 'loaded' | 'failed';

// Images load hidden. The section and each image only appear once that image has loaded,
// so a failed load never flashes on screen.
export function ParkImages({ images }: Props) {
  const [status, setStatus] = useState<Record<string, LoadStatus>>({});
  const candidates = images.filter((image) => status[image.src] !== 'failed');

  if (candidates.length === 0) return null;

  const hasLoaded = candidates.some((image) => status[image.src] === 'loaded');
  const mark = (src: string, value: LoadStatus) =>
    setStatus((previous) => ({ ...previous, [src]: value }));

  return (
    <section className="park-images" aria-labelledby="park-images-heading" hidden={!hasLoaded}>
      <h3 id="park-images-heading">Photos</h3>
      <ul>
        {candidates.map((image) => (
          <li key={image.src} hidden={status[image.src] !== 'loaded'}>
            <img
              src={image.src}
              alt={image.alt}
              onLoad={() => mark(image.src, 'loaded')}
              onError={() => mark(image.src, 'failed')}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
