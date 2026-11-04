import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { ViewToggle } from './ViewToggle';

describe('ViewToggle', () => {
  it('reflects the current view with aria-pressed', () => {
    render(<ViewToggle view="list" onChange={() => {}} />);
    expect(screen.getByRole('button', { name: /list/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /map/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the chosen view', async () => {
    const onChange = vi.fn();
    render(<ViewToggle view="list" onChange={onChange} />);
    await userEvent.click(screen.getByRole('button', { name: /map/i }));
    expect(onChange).toHaveBeenCalledWith('map');
  });

  it('has no axe violations', async () => {
    const { container } = render(<ViewToggle view="map" onChange={() => {}} />);
    expect(await axe(container)).toHaveNoViolations();
  });
});
