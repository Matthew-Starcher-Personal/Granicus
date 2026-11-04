import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { parks } from '../data/parks';
import { ParkList } from './ParkList';

const noRef = () => () => {};

describe('ParkList', () => {
  it('lists all parks as buttons in a labelled list', () => {
    render(<ParkList parks={parks} selectedId={null} onSelect={() => {}} buttonRef={noRef} />);
    const list = screen.getByRole('list', { name: '12 parks' });
    expect(list.querySelectorAll('button')).toHaveLength(12);
    expect(screen.getByRole('button', { name: /Highland Dog Park/ })).toBeInTheDocument();
  });

  it('marks the selected park with aria-current', () => {
    render(<ParkList parks={parks} selectedId="prospect-park" onSelect={() => {}} buttonRef={noRef} />);
    expect(screen.getByRole('button', { name: /Prospect Park/ })).toHaveAttribute('aria-current', 'true');
    expect(screen.getByRole('button', { name: /Lakeshore Point/ })).not.toHaveAttribute('aria-current');
  });

  it('selects a park with Enter and Space', async () => {
    const onSelect = vi.fn();
    render(<ParkList parks={parks} selectedId={null} onSelect={onSelect} buttonRef={noRef} />);
    const user = userEvent.setup();
    await user.tab();
    await user.keyboard('{Enter}');
    expect(onSelect).toHaveBeenLastCalledWith(parks[0].id);
    await user.tab();
    await user.keyboard(' ');
    expect(onSelect).toHaveBeenLastCalledWith(parks[1].id);
  });

  it('has no axe violations', async () => {
    const { container } = render(
      <ParkList parks={parks} selectedId="prospect-park" onSelect={() => {}} buttonRef={noRef} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
