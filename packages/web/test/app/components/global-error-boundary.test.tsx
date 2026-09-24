/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

import { GlobalErrorBoundary } from '@/app/components/global-error-boundary';

const Boom = () => {
  throw new Error('bootstrap exploded');
};

function renderCrashedApp() {
  render(
    <GlobalErrorBoundary>
      <Boom />
    </GlobalErrorBoundary>,
  );
}

describe('GlobalErrorBoundary fallback outside every provider', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  it('shows the diagnostics without a provider in the tree and without a click', () => {
    renderCrashedApp();

    expect(screen.getByText('Something went wrong')).toBeTruthy();
    expect(screen.getByText('Technical Details')).toBeTruthy();
    expect(document.body.textContent).toContain('Message: bootstrap exploded');
    expect(document.body.textContent).toContain('Stack:');
  });

  it('keeps query-string secrets out of the diagnostics', () => {
    window.history.pushState({}, '', '/authenticate?response=super-secret-jwt');

    renderCrashedApp();

    expect(document.body.textContent).toContain('URL: http://localhost:3000/authenticate');
    expect(document.body.textContent).not.toContain('super-secret-jwt');
  });

  it('keeps the recovery actions reachable', () => {
    renderCrashedApp();

    expect(screen.getByText('Reload page')).toBeTruthy();
    expect(screen.getByText('Go to home')).toBeTruthy();
  });
});
