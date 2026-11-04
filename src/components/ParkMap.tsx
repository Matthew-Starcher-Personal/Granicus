import L from 'leaflet';
import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import type { Park } from '../data/types';

export type ParkMapHandle = { focusMarker: (id: string) => void };

type Props = {
  parks: Park[];
  selectedId: string | null;
  visible: boolean;
  reducedMotion: boolean;
  onSelect: (id: string) => void;
};

type LocatedPark = Park & { location: { lat: number; lng: number } };

const NYC_CENTER: L.LatLngTuple = [40.7128, -73.95];

const pinIcon = L.divIcon({
  className: 'park-pin',
  html: '<span class="park-pin__shape" aria-hidden="true"><span class="park-pin__dot"></span></span>',
  iconSize: [36, 44],
  iconAnchor: [18, 44],
});

type MapBehaviorProps = {
  parks: LocatedPark[];
  selectedId: string | null;
  visible: boolean;
  reducedMotion: boolean;
};

function MapBehavior({ parks, selectedId, visible, reducedMotion }: MapBehaviorProps) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    const container = map.getContainer();
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Map of parks. Use arrow keys to pan and plus or minus to zoom.');
  }, [map]);

  useEffect(() => {
    if (!visible) return;
    map.invalidateSize();
    if (!hasFitted.current && parks.length > 0) {
      map.fitBounds(L.latLngBounds(parks.map((p) => [p.location.lat, p.location.lng])), { padding: [40, 40] });
      hasFitted.current = true;
    }
  }, [map, visible, parks]);

  useEffect(() => {
    if (!visible || !selectedId) return;
    const park = parks.find((p) => p.id === selectedId);
    if (park) map.panTo([park.location.lat, park.location.lng], { animate: !reducedMotion });
  }, [map, visible, selectedId, parks, reducedMotion]);

  return null;
}

export const ParkMap = forwardRef<ParkMapHandle, Props>(function ParkMap(
  { parks, selectedId, visible, reducedMotion, onSelect },
  ref,
) {
  const markers = useRef(new Map<string, L.Marker>());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const selectedIdRef = useRef(selectedId);
  selectedIdRef.current = selectedId;
  const located = useMemo(() => parks.filter((p): p is LocatedPark => p.location !== null), [parks]);

  useImperativeHandle(ref, () => ({
    focusMarker: (id) => markers.current.get(id)?.getElement()?.focus(),
  }));

  useEffect(() => {
    for (const [id, marker] of markers.current) {
      const isSelected = id === selectedId;
      marker.getElement()?.classList.toggle('park-pin--selected', isSelected);
      marker.setZIndexOffset(isSelected ? 1000 : 0);
    }
  }, [selectedId]);

  // Leaflet creates the icon element when the marker is added to the map, so decorate it then.
  const decorateMarker = (park: LocatedPark, marker: L.Marker) => {
    markers.current.set(park.id, marker);
    const el = marker.getElement();
    if (!el) return;
    el.dataset.parkId = park.id;
    el.setAttribute('aria-label', park.name);
    el.classList.toggle('park-pin--selected', park.id === selectedIdRef.current);
    el.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onSelectRef.current(park.id);
      }
    });
  };

  return (
    <MapContainer center={NYC_CENTER} zoom={11} className="park-map" scrollWheelZoom>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {located.map((park) => (
        <Marker
          key={park.id}
          position={[park.location.lat, park.location.lng]}
          icon={pinIcon}
          title={park.name}
          keyboard
          eventHandlers={{
            add: (event) => decorateMarker(park, event.target as L.Marker),
            remove: () => markers.current.delete(park.id),
            click: () => onSelectRef.current(park.id),
          }}
        />
      ))}
      <MapBehavior parks={located} selectedId={selectedId} visible={visible} reducedMotion={reducedMotion} />
    </MapContainer>
  );
});
