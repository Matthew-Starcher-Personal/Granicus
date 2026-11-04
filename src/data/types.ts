export type Amenity = { slug: string; label: string };

export type ParkImage = { src: string };

export type Park = {
  id: string;
  name: string;
  description: string | null;
  location: { lat: number; lng: number } | null;
  address: string | null;
  hours: string | null;
  acreage: number | null;
  rating: number | null;
  amenities: Amenity[];
  images: ParkImage[];
};
