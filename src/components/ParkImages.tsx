import { useId, useState } from 'react';
import type { ParkImage } from '../data/types';

type Props = { images: ParkImage[]; parkName: string };

type LoadStatus = 'loaded' | 'failed';

// Images load hidden. The section and each image only appear once that image has loaded,
// so a failed load never flashes on screen. Alt text counts only the photos actually shown.
export function ParkImages({ images, parkName }: Props) {
  const [status, setStatus] = useState<Record<string, LoadStatus>>({});
  const headingId = useId();
  const candidates = images.filter((image) => status[image.src] !== 'failed');

  if (candidates.length === 0) return null;

  const loaded = candidates.filter((image) => status[image.src] === 'loaded');
  const altFor = (src: string) => {
    const index = loaded.findIndex((image) => image.src === src);
    return index === -1 ? '' : `${parkName}, photo ${index + 1} of ${loaded.length}`;
  };
  const mark = (src: string, value: LoadStatus) =>
    setStatus((previous) => ({ ...previous, [src]: value }));

  return (
    <section className="park-images" aria-labelledby={headingId} hidden={loaded.length === 0}>
      <h3 id={headingId}>Photos</h3>
      <ul>
        {candidates.map((image) => (
          <li key={image.src} hidden={status[image.src] !== 'loaded'}>
            <img
              src={image.src}
              alt={altFor(image.src)}
              onLoad={() => mark(image.src, 'loaded')}
              onError={() => mark(image.src, 'failed')}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}
