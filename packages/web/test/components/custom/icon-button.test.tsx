// @vitest-environment jsdom
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { Add01Icon } from '@hugeicons/core-free-icons';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Link } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { IconButton } from '@/components/custom/icon-button';

describe('IconButton', () => {
  it('renders as its child link, with the icon inside and no button around it', () => {
    render(
      <MemoryRouter>
        <IconButton icon={Add01Icon} asChild>
          <Link to="/destinations/new">New Destination</Link>
        </IconButton>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'New Destination' });
    expect(link.getAttribute('href')).toBe('/destinations/new');
    expect(link.querySelector('svg')).not.toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a button when it is not given asChild', () => {
    render(<IconButton icon={Add01Icon}>New Template</IconButton>);

    const button = screen.getByRole('button', { name: 'New Template' });
    expect(button.querySelector('svg')).not.toBeNull();
  });
});
