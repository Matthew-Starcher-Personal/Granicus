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

// Accepts real numbers and plain decimal strings like "4.7" (not "", "0x10" or "1e3").
function cleanNumber(value: unknown): number | null {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    value = /^-?\d+(\.\d+)?$/.test(trimmed) ? Number(trimmed) : null;
  }
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

// The rating scale isn't confirmed, so only negatives are rejected; 0 is a real rating.
function cleanRating(value: unknown): number | null {
  const rating = cleanNumber(value);
  return rating === null || rating < 0 ? null : Math.round(rating * 10) / 10;
}

// Kept unrounded so the UI can tell a tiny park ("<0.1 acres") from a missing size.
function cleanAcreage(value: unknown): number | null {
  const acreage = cleanNumber(value);
  return acreage === null || acreage <= 0 ? null : acreage;
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

function cleanImages(value: unknown): ParkImage[] {
  if (!Array.isArray(value)) return [];
  const sources = [
    ...new Set(
      value.map(cleanString).filter((src): src is string => src !== null && /^https?:\/\//i.test(src)),
    ),
  ];
  return sources.map((src) => ({ src }));
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
    acreage: cleanAcreage(raw.acreage),
    rating: cleanRating(raw.rating),
    amenities: cleanAmenities(raw.amenities),
    images: cleanImages(raw.images),
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
