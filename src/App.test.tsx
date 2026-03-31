import { render } from '@testing-library/react';
import App from './App';

test('smoke: app mounts', () => {
  render(<App />);
  expect(true).toBe(true);
});
