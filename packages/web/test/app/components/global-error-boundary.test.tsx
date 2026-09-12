/**
 * @vitest-environment jsdom
 */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('@/lib/error-reporting', () => ({
  errorReporting: {
    isChunkLoadError: () => false,
    report: vi.fn(),
  },
}));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

vi.mock('react-router-dom', () => ({
  useRouteError: vi.fn(),
}));

// eslint-disable-next-line import/first
import { GlobalErrorBoundary } from '@/app/components/global-error-boundary';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

const ProblemChild = () => {
  throw new Error('Test global crash error');
};

describe('GlobalErrorBoundary', () => {
  let root: Root | undefined;
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
    document.body.innerHTML = '';
  });

  it('renders fallback and reveals technical details without unmounting outside QueryClientProvider', () => {
    act(() => {
      root = createRoot(container);
      root.render(
        <GlobalErrorBoundary>
          <ProblemChild />
        </GlobalErrorBoundary>,
      );
    });

    expect(container.textContent).toContain('Something went wrong');

    const showDetailsButton = Array.from(
      container.querySelectorAll('button'),
    ).find((b) => b.textContent?.includes('Show technical details'));
    expect(showDetailsButton).toBeDefined();

    act(() => {
      showDetailsButton?.click();
    });

    expect(container.textContent).toContain('Hide technical details');
    const pre = container.querySelector('pre');
    expect(pre).not.toBeNull();
    expect(pre?.textContent).toContain('Test global crash error');
    expect(container.textContent).toContain('Something went wrong');
  });
});
