export type MobileView = 'list' | 'map';

type Props = {
  view: MobileView;
  onChange: (view: MobileView) => void;
};

export function ViewToggle({ view, onChange }: Props) {
  return (
    <div className="view-toggle" role="group" aria-label="View parks as">
      <button type="button" aria-pressed={view === 'list'} onClick={() => onChange('list')}>
        List
      </button>
      <button type="button" aria-pressed={view === 'map'} onClick={() => onChange('map')}>
        Map
      </button>
    </div>
  );
}
