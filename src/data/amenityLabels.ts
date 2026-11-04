const AMENITY_LABELS: Record<string, string> = {
  'accessible-paths': 'Accessible paths',
  basketball: 'Basketball',
  'bike-path': 'Bike path',
  boardwalk: 'Boardwalk',
  cafe: 'Cafe',
  'dog-run': 'Dog run',
  'event-lawn': 'Event lawn',
  fishing: 'Fishing',
  'food-vendors': 'Food vendors',
  gardens: 'Gardens',
  'gift-shop': 'Gift shop',
  'kayak-launch': 'Kayak launch',
  lake: 'Lake',
  lighting: 'Lighting',
  parking: 'Parking',
  'picnic-areas': 'Picnic areas',
  playground: 'Playground',
  restrooms: 'Restrooms',
  'skate-park': 'Skate park',
  'splash-pad': 'Splash pad',
  'sports-fields': 'Sports fields',
  trails: 'Trails',
  'water-fountain': 'Water fountain',
  waterfront: 'Waterfront',
  wifi: 'Wi-Fi',
  'wildlife-viewing': 'Wildlife viewing',
};

export function amenityLabel(slug: string): string {
  const mapped = AMENITY_LABELS[slug];
  if (mapped) return mapped;
  const words = slug.replace(/-+/g, ' ').trim();
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export const KNOWN_AMENITY_SLUGS = Object.keys(AMENITY_LABELS);
