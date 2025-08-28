import { render, screen } from '@testing-library/react';
import App from './App';

describe('App', () => {
  it('renders the app with Tailwind CSS classes', () => {
    render(<App />);
    
    // Test that Tailwind classes are applied
    const element = screen.getByText('Activepieces');
    expect(element).toHaveClass('text-2xl');
    expect(element).toHaveClass('font-bold');
  });
});
