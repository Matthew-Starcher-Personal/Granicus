import { amenityLabel } from './amenityLabels';
import type { Amenity, Park, ParkImage } from './types';

type RawRecord = Record<string, unknown>;

function isRecord(value: unknown): value is RawRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function cleanString(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed === '' ? null : trimmed;
}

function cleanNumber(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function cleanLocation(value: unknown): Park['location'] {
  if (!isRecord(value)) return null;
  const lat = cleanNumber(value.lat);
  const lng = cleanNumber(value.lng);
  if (lat === null || lng === null) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  return { lat, lng };
}

// "Dog_Run", "dog run" and "dog-run" are the same amenity.
function cleanSlug(value: unknown): string | null {
  const text = cleanString(value);
  if (text === null) return null;
  const slug = text.toLowerCase().replace(/[\s_-]+/g, '-').replace(/^-|-$/g, '');
  return slug === '' ? null : slug;
}

function cleanAmenities(value: unknown): Amenity[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const amenities: Amenity[] = [];
  for (const item of value) {
    const slug = cleanSlug(item);
    if (slug === null || seen.has(slug)) continue;
    seen.add(slug);
    amenities.push({ slug, label: amenityLabel(slug) });
  }
  return amenities;
}

function cleanImages(value: unknown, parkName: string): ParkImage[] {
  if (!Array.isArray(value)) return [];
  const sources = value
    .map(cleanString)
    .filter((src): src is string => src !== null && /^https?:\/\//i.test(src));
  return sources.map((src, index) => ({
    src,
    alt: `${parkName}, photo ${index + 1} of ${sources.length}`,
  }));
}

export function normalizePark(raw: unknown): Park | null {
  if (!isRecord(raw)) return null;
  const id = cleanString(raw.id);
  const name = cleanString(raw.name);
  if (id === null || name === null) return null;
  const location = isRecord(raw.location) ? raw.location : {};

  return {
    id,
    name,
    description: cleanString(raw.description),
    location: cleanLocation(location),
    address: cleanString(location.address),
    hours: cleanString(raw.hours),
    acreage: cleanNumber(raw.acreage),
    rating: cleanNumber(raw.rating),
    amenities: cleanAmenities(raw.amenities),
    images: cleanImages(raw.images, name),
  };
}

const collator = new Intl.Collator('en', { sensitivity: 'base' });

export function normalizeParks(raw: unknown): Park[] {
  if (!Array.isArray(raw)) return [];
  const parks: Park[] = [];
  for (const record of raw) {
    const park = normalizePark(record);
    if (park) {
      parks.push(park);
    } else if (import.meta.env.DEV) {
      console.warn('Dropped park record with no valid id or name:', record);
    }
  }
  return parks.sort((a, b) => collator.compare(a.name, b.name));
}
