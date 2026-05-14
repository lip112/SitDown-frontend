import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import App from './App';

describe('App', () => {
  it('shows the login screen for guests', () => {
    render(<App />);

    expect(screen.getByRole('heading', { name: /UNIV SITDOWN/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '로그인' })).toBeInTheDocument();
  });
});
