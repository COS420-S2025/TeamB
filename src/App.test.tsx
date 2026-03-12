import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Busy Bee Calendar', () => {
  render(<App />);
  const heading = screen.getByText(/Busy Bee Calendar/i);
  expect(heading).toBeInTheDocument();
});
