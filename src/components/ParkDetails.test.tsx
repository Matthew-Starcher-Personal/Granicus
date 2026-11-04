import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { parks } from '../data/parks';
import { ParkDetails } from './ParkDetails';

const park = (id: string) => parks.find((p) => p.id === id)!;

describe('ParkDetails', () => {
  it('shows every field the park has, verbatim', () => {
    render(<ParkDetails park={park('prospect-park')} onBack={() => {}} />);
    expect(screen.getByRole('heading', { level: 2, name: 'Prospect Park' })).toHaveFocus();
    expect(screen.getByText(/526-acre park in the heart of Brooklyn/)).toBeInTheDocument();
    expect(screen.getByText('Brooklyn, NY 11225')).toBeInTheDocument();
    expect(screen.getByText('6:00 AM - 1:00 AM')).toBeInTheDocument();
    expect(screen.getByText('526 acres')).toBeInTheDocument();
    expect(screen.getByText('4.7')).toBeInTheDocument();
    const amenities = screen.getByRole('region', { name: 'Amenities' });
    expect(within(amenities).getByText('Dog run')).toBeInTheDocument();
  });

  it('omits fields that are missing from the data', () => {
    const { unmount } = render(<ParkDetails park={park('old-mill-botanical-garden')} onBack={() => {}} />);
    expect(document.querySelector('.park-details__description')).toBeNull();
    unmount();

    render(<ParkDetails park={park('highland-dog-park')} onBack={() => {}} />);
    expect(screen.queryByText('Address')).toBeNull();
  });

  it('omits rating and photos for Cedar Hill', () => {
    render(<ParkDetails park={park('cedar-hill-nature-preserve')} onBack={() => {}} />);
    expect(screen.queryByText('Rating')).toBeNull();
    expect(screen.queryByRole('heading', { name: 'Photos' })).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('shows ratings with one decimal and no denominator', () => {
    render(<ParkDetails park={park('central-plaza-green')} onBack={() => {}} />);
    expect(screen.getByText('4.0')).toBeInTheDocument();
    expect(screen.queryByText(/\/ ?5/)).toBeNull();
  });

  it('keeps photos hidden until they load', () => {
    render(<ParkDetails park={park('prospect-park')} onBack={() => {}} />);
    expect(screen.queryByRole('heading', { name: 'Photos' })).toBeNull();
    expect(screen.queryByRole('img')).toBeNull();

    const [first] = document.querySelectorAll('.park-images img');
    fireEvent.load(first);
    expect(screen.getByRole('heading', { name: 'Photos' })).toBeVisible();
    expect(screen.getAllByRole('img').map((img) => img.getAttribute('alt'))).toEqual([
      'Prospect Park, photo 1 of 1',
    ]);

    fireEvent.load(document.querySelectorAll('.park-images img')[1]);
    expect(screen.getAllByRole('img').map((img) => img.getAttribute('alt'))).toEqual([
      'Prospect Park, photo 1 of 2',
      'Prospect Park, photo 2 of 2',
    ]);
  });

  it('never shows images that fail to load, or the photos section if all fail', () => {
    render(<ParkDetails park={park('prospect-park')} onBack={() => {}} />);
    const [first, second] = document.querySelectorAll('.park-images img');
    fireEvent.error(first);
    expect(screen.queryByRole('heading', { name: 'Photos' })).toBeNull();
    fireEvent.error(second);
    expect(document.querySelector('.park-images')).toBeNull();
  });

  it('shows the photos that load and drops the ones that fail', () => {
    render(<ParkDetails park={park('prospect-park')} onBack={() => {}} />);
    const [first, second] = document.querySelectorAll('.park-images img');
    fireEvent.error(first);
    fireEvent.load(second);
    expect(screen.getByRole('heading', { name: 'Photos' })).toBeVisible();
    // Counted among the photos shown, not the URLs in the data.
    expect(screen.getAllByRole('img').map((img) => img.getAttribute('alt'))).toEqual([
      'Prospect Park, photo 1 of 1',
    ]);
  });

  it('calls onBack from the back button', async () => {
    const onBack = vi.fn();
    render(<ParkDetails park={park('prospect-park')} onBack={onBack} />);
    await userEvent.click(screen.getByRole('button', { name: /back to all parks/i }));
    expect(onBack).toHaveBeenCalledOnce();
  });

  it('has no axe violations', async () => {
    const { container } = render(<ParkDetails park={park('prospect-park')} onBack={() => {}} />);
    document.querySelectorAll('.park-images img').forEach((img) => fireEvent.load(img));
    expect(await axe(container)).toHaveNoViolations();
  });
});
