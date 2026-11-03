// @vitest-environment jsdom
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute -- @testing-library/jest-dom is not a dependency of packages/web */
import { render, screen, within } from '@testing-library/react';
import { forwardRef, useImperativeHandle } from 'react';
import { MemoryRouter, Link } from 'react-router-dom';
import { describe, expect, it } from 'vitest';

import { AnimatedIconButton } from '@/components/custom/animated-icon-button';

const FakeIcon = forwardRef<
  { startAnimation: () => void; stopAnimation: () => void },
  { size?: number }
>((_props, ref) => {
  useImperativeHandle(ref, () => ({
    startAnimation: () => undefined,
    stopAnimation: () => undefined,
  }));
  return <svg data-testid="icon" />;
});
FakeIcon.displayName = 'FakeIcon';

describe('AnimatedIconButton', () => {
  it('renders as its child link, with the icon inside and no button around it', () => {
    render(
      <MemoryRouter>
        <AnimatedIconButton icon={FakeIcon} asChild>
          <Link to="/destinations/new">New Destination</Link>
        </AnimatedIconButton>
      </MemoryRouter>,
    );

    const link = screen.getByRole('link', { name: 'New Destination' });
    expect(link.getAttribute('href')).toBe('/destinations/new');
    expect(within(link).getByTestId('icon')).not.toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('renders a button when it is not given asChild', () => {
    render(
      <AnimatedIconButton icon={FakeIcon}>New Template</AnimatedIconButton>,
    );

    const button = screen.getByRole('button', { name: 'New Template' });
    expect(within(button).getByTestId('icon')).not.toBeNull();
  });
});
