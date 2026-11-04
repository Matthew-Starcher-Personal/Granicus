import rawParks from './parks.json';
import { amenityLabel, KNOWN_AMENITY_SLUGS } from './amenityLabels';
import { normalizePark, normalizeParks } from './normalize';

const parks = normalizeParks(rawParks);
const byId = (id: string) => parks.find((p) => p.id === id)!;

describe('normalizeParks with the sample data', () => {
  it('returns all 12 parks sorted A–Z by name', () => {
    expect(parks).toHaveLength(12);
    const names = parks.map((p) => p.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('keeps missing values as null or empty arrays', () => {
    expect(byId('old-mill-botanical-garden').description).toBeNull();
    expect(byId('highland-dog-park').address).toBeNull();
    expect(byId('cedar-hill-nature-preserve').rating).toBeNull();
    expect(byId('cedar-hill-nature-preserve').images).toEqual([]);
    expect(byId('east-ridge-trailhead').images).toEqual([]);
  });

  it('keeps hours and address verbatim', () => {
    const lakeshore = byId('lakeshore-point');
    expect(lakeshore.hours).toBe('Dawn to dusk');
    expect(lakeshore.address).toBe('Shore Pkwy');
    expect(byId('prospect-park').hours).toBe('6:00 AM - 1:00 AM');
  });

  it('plots Cedar Hill at the coordinates given', () => {
    expect(byId('cedar-hill-nature-preserve').location).toEqual({ lat: 40.7128, lng: -74.006 });
  });

  it('gives every park a location in the sample', () => {
    expect(parks.every((p) => p.location !== null)).toBe(true);
  });

  it('labels every amenity slug in the sample from the map', () => {
    const slugs = new Set(rawParks.flatMap((p) => p.amenities));
    for (const slug of slugs) expect(KNOWN_AMENITY_SLUGS).toContain(slug);
    expect(byId('central-plaza-green').amenities).toContainEqual({ slug: 'wifi', label: 'Wi-Fi' });
  });

  it('builds image alt text from the park name and position', () => {
    expect(byId('prospect-park').images.map((i) => i.alt)).toEqual([
      'Prospect Park, photo 1 of 2',
      'Prospect Park, photo 2 of 2',
    ]);
  });
});

describe('normalizePark edge cases', () => {
  const base = { id: 'x', name: 'X Park', location: { lat: 40, lng: -73 } };

  it('drops records without a valid id or name', () => {
    expect(normalizePark({ ...base, id: '  ' })).toBeNull();
    expect(normalizePark({ ...base, name: null })).toBeNull();
    expect(normalizePark('not a record')).toBeNull();
  });

  it('trims strings and turns blank strings into null', () => {
    const park = normalizePark({ ...base, name: '  X Park ', description: '   ', hours: ' 24 hours ' })!;
    expect(park.name).toBe('X Park');
    expect(park.description).toBeNull();
    expect(park.hours).toBe('24 hours');
  });

  it('turns non-finite numbers into null', () => {
    const park = normalizePark({ ...base, acreage: Number.NaN, rating: '4.5' })!;
    expect(park.acreage).toBeNull();
    expect(park.rating).toBeNull();
  });

  it('sets location to null for missing or out-of-range coordinates', () => {
    expect(normalizePark({ ...base, location: { lat: 95, lng: 0 } })!.location).toBeNull();
    expect(normalizePark({ ...base, location: { lat: 40 } })!.location).toBeNull();
    expect(normalizePark({ id: 'x', name: 'X' })!.location).toBeNull();
  });

  it('removes empty and duplicate amenities and keeps order', () => {
    const park = normalizePark({ ...base, amenities: ['trails', '', 'trails', 'new-thing'] })!;
    expect(park.amenities).toEqual([
      { slug: 'trails', label: 'Trails' },
      { slug: 'new-thing', label: 'New thing' },
    ]);
  });

  it('treats amenity slugs that differ only in case or separators as the same', () => {
    const park = normalizePark({ ...base, amenities: ['Dog-Run', 'dog_run', ' dog run ', 'ROCK__climbing', '_-_'] })!;
    expect(park.amenities).toEqual([
      { slug: 'dog-run', label: 'Dog run' },
      { slug: 'rock-climbing', label: 'Rock climbing' },
    ]);
  });

  it('keeps only http(s) image URLs', () => {
    const park = normalizePark({ ...base, images: ['', 'ftp://a', 'https://a/1.jpg', 42] })!;
    expect(park.images).toEqual([{ src: 'https://a/1.jpg', alt: 'X Park, photo 1 of 1' }]);
  });

  it('drops repeated image URLs', () => {
    const park = normalizePark({ ...base, images: ['https://a/1.jpg', ' https://a/1.jpg', 'https://a/2.jpg'] })!;
    expect(park.images.map((i) => i.src)).toEqual(['https://a/1.jpg', 'https://a/2.jpg']);
  });

  it('returns an empty list for non-array input', () => {
    expect(normalizeParks({})).toEqual([]);
  });
});

describe('amenityLabel', () => {
  it('falls back to sentence case for unknown slugs', () => {
    expect(amenityLabel('rock-climbing-wall')).toBe('Rock climbing wall');
  });
});
