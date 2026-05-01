import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

describe('PomodoroFlow App', () => {
  test('renders without crashing', () => {
    expect(() => render(<App />)).not.toThrow();
  });
});
