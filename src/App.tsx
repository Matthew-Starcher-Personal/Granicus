import { useCallback, useEffect, useRef, useState, type RefCallback } from 'react';
import { ParkDetails } from './components/ParkDetails';
import { ParkList } from './components/ParkList';
import { ParkMap, type ParkMapHandle } from './components/ParkMap';
import { ViewToggle, type MobileView } from './components/ViewToggle';
import type { Park } from './data/types';
import { DESKTOP_QUERY, REDUCED_MOTION_QUERY, useMediaQuery } from './hooks/useMediaQuery';

type Origin = 'list' | 'map';
type FocusRequest = { origin: Origin; id: string };

type Props = { parks: Park[] };

export function App({ parks }: Props) {
  const isDesktop = useMediaQuery(DESKTOP_QUERY);
  const reducedMotion = useMediaQuery(REDUCED_MOTION_QUERY);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [mobileView, setMobileView] = useState<MobileView>('list');
  const [origin, setOrigin] = useState<Origin>('list');
  const [focusRequest, setFocusRequest] = useState<FocusRequest | null>(null);

  const panelRef = useRef<HTMLElement>(null);
  const mapRef = useRef<ParkMapHandle>(null);
  const listButtons = useRef(new Map<string, HTMLButtonElement>());
  const savedScroll = useRef({ panel: 0, page: 0 });
  const isDesktopRef = useRef(isDesktop);
  isDesktopRef.current = isDesktop;

  const selectedPark = detailsOpen ? parks.find((p) => p.id === selectedId) ?? null : null;

  // One cached ref callback per park, so React doesn't detach and reattach every button on each render.
  const buttonRefCallbacks = useRef(new Map<string, RefCallback<HTMLButtonElement>>());
  const buttonRef = useCallback((id: string) => {
    let callback = buttonRefCallbacks.current.get(id);
    if (!callback) {
      callback = (el) => {
        if (el) listButtons.current.set(id, el);
        else listButtons.current.delete(id);
      };
      buttonRefCallbacks.current.set(id, callback);
    }
    return callback;
  }, []);

  const openPark = useCallback(
    (id: string, from: Origin) => {
      if (!parks.some((p) => p.id === id)) return;
      if (!detailsOpen) {
        savedScroll.current = { panel: panelRef.current?.scrollTop ?? 0, page: window.scrollY };
      }
      setSelectedId(id);
      setDetailsOpen(true);
      setOrigin(from);
    },
    [parks, detailsOpen],
  );

  const closeDetails = useCallback(() => {
    if (!selectedId) return;
    setDetailsOpen(false);
    if (!isDesktop) setMobileView(origin);
    setFocusRequest({ origin, id: selectedId });
  }, [selectedId, isDesktop, origin]);

  useEffect(() => {
    if (!detailsOpen) return;
    if (panelRef.current) panelRef.current.scrollTop = 0;
    // Read the breakpoint through a ref: crossing it (resize, rotation) must not reset scroll.
    if (!isDesktopRef.current) window.scrollTo(0, 0);
  }, [detailsOpen, selectedId]);

  useEffect(() => {
    if (!detailsOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.isComposing) return;
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      closeDetails();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [detailsOpen, closeDetails]);

  useEffect(() => {
    if (!focusRequest) return;
    const frame = requestAnimationFrame(() => {
      if (panelRef.current) panelRef.current.scrollTop = savedScroll.current.panel;
      window.scrollTo(0, savedScroll.current.page);
      if (focusRequest.origin === 'map') mapRef.current?.focusMarker(focusRequest.id);
      else listButtons.current.get(focusRequest.id)?.focus();
      setFocusRequest(null);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRequest]);

  const onSkip = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    mapRef.current?.focusMap();
  };

  const panelVisible = isDesktop || detailsOpen || mobileView === 'list';
  const mapVisible = isDesktop || (!detailsOpen && mobileView === 'map');

  return (
    <div className={!isDesktop && mapVisible ? 'app app--map-view' : 'app'}>
      {/* Desktop only: on mobile the list and map are separate views behind the List/Map toggle. */}
      {isDesktop && (
        <a className="skip-link" href="#park-map" onClick={onSkip}>
          Skip to map
        </a>
      )}
      <header className="site-header">
        <h1>NYC Parks Explorer</h1>
        <p>Explore New York City parks on the map or in the list.</p>
      </header>
      <main className="layout">
        {!isDesktop && !detailsOpen && <ViewToggle view={mobileView} onChange={setMobileView} />}
        <section
          id="park-panel"
          ref={panelRef}
          className="panel"
          aria-label={selectedPark ? 'Park details' : 'Park list'}
          hidden={!panelVisible}
        >
          <div hidden={detailsOpen}>
            <ParkList
              parks={parks}
              selectedId={selectedId}
              onSelect={(id) => openPark(id, 'list')}
              buttonRef={buttonRef}
            />
          </div>
          {selectedPark && <ParkDetails park={selectedPark} onBack={closeDetails} />}
        </section>
        <div className={mapVisible ? 'map-area' : 'map-area map-area--hidden'}>
          <ParkMap
            ref={mapRef}
            parks={parks}
            selectedId={selectedId}
            visible={mapVisible}
            reducedMotion={reducedMotion}
            onSelect={(id) => openPark(id, 'map')}
          />
        </div>
      </main>
    </div>
  );
}
