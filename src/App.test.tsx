import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { forwardRef } from 'react';
import { App } from './App';
import { parks } from './data/parks';

vi.mock('./components/ParkMap', () => ({
  ParkMap: forwardRef(function MockMap() {
    return <div data-testid="map" />;
  }),
}));

function setViewport(desktop: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes('min-width') ? desktop : false,
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('App', () => {
  it('opens details from the list, announces them, and returns focus on back', async () => {
    setViewport(true);
    render(<App parks={parks} />);
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Prospect Park/ }));
    expect(screen.getByRole('heading', { level: 2, name: 'Prospect Park' })).toHaveFocus();
    expect(screen.getByRole('status')).toHaveTextContent('Showing details for Prospect Park');
    expect(screen.queryByRole('list', { name: '12 parks' })).toBeNull();

    await user.click(screen.getByRole('button', { name: /back to all parks/i }));
    await waitFor(() => expect(screen.getByRole('button', { name: /Prospect Park/ })).toHaveFocus());
    expect(screen.getByRole('button', { name: /Prospect Park/ })).toHaveAttribute('aria-current', 'true');
  });

  it('closes details with Escape', async () => {
    setViewport(true);
    render(<App parks={parks} />);
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /Lakeshore Point/ }));
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.getByRole('button', { name: /Lakeshore Point/ })).toHaveFocus());
  });

  it('shows the List/Map toggle only on mobile and hides it while details are open', async () => {
    setViewport(false);
    render(<App parks={parks} />);
    const user = userEvent.setup();
    expect(screen.getByRole('button', { name: /^.?\s*List$/ })).toHaveAttribute('aria-pressed', 'true');

    await user.click(screen.getByRole('button', { name: /Highland Dog Park/ }));
    expect(screen.queryByRole('group', { name: 'View parks as' })).toBeNull();
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /back to all parks/i }));
    });
    expect(screen.getByRole('group', { name: 'View parks as' })).toBeInTheDocument();
  });

  it('has no toggle on desktop', () => {
    setViewport(true);
    render(<App parks={parks} />);
    expect(screen.queryByRole('group', { name: 'View parks as' })).toBeNull();
  });
});
