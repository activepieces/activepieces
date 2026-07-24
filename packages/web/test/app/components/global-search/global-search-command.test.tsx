/**
 * @vitest-environment jsdom
 *
 * Regression test for https://github.com/activepieces/activepieces/issues/13555
 * (GIT-1530): the global search trigger button must not render when the
 * embedding state sets `hideGlobalSearch`.
 *
 * This file uses raw `react-dom` + React's `act` rather than
 * @testing-library/react (which is not a dependency of this package), so the
 * testing-library lint rules that assume that library do not apply.
 */
/* eslint-disable testing-library/no-unnecessary-act */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('lucide-react', () => ({
  Search: () => null,
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({
    children,
    ...props
  }: React.PropsWithChildren<React.ComponentProps<'button'>>) => (
    <button {...props}>{children}</button>
  ),
}));

vi.mock('@/app/components/global-search/global-search-context', () => ({
  useGlobalSearch: () => ({ open: false, setOpen: vi.fn() }),
}));

import { GlobalSearchCommand } from '@/app/components/global-search/global-search-command';
import {
  EmbeddingProvider,
  useEmbedding,
} from '@/components/providers/embed-provider';

declare global {
  // Tells React the test wraps updates in act(); see React's act() docs.
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

function SetEmbedState({ hideGlobalSearch }: { hideGlobalSearch: boolean }) {
  const { setEmbedState } = useEmbedding();
  React.useEffect(() => {
    setEmbedState((prev) => ({
      ...prev,
      isEmbedded: true,
      hideGlobalSearch,
    }));
  }, [hideGlobalSearch, setEmbedState]);
  return null;
}

let root: Root | null = null;
let container: HTMLDivElement | null = null;

function renderCommand({
  hideGlobalSearch,
}: { hideGlobalSearch?: boolean } = {}) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => {
    root?.render(
      <EmbeddingProvider>
        {hideGlobalSearch !== undefined && (
          <SetEmbedState hideGlobalSearch={hideGlobalSearch} />
        )}
        <GlobalSearchCommand />
      </EmbeddingProvider>,
    );
  });
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe('GlobalSearchCommand', () => {
  it('renders the search trigger outside embed mode', () => {
    renderCommand();
    expect(container?.querySelector('button')).not.toBeNull();
  });

  it('renders the search trigger in embed mode when hideGlobalSearch is off', () => {
    renderCommand({ hideGlobalSearch: false });
    expect(container?.querySelector('button')).not.toBeNull();
  });

  it('renders nothing when hideGlobalSearch is set', () => {
    renderCommand({ hideGlobalSearch: true });
    expect(container?.querySelector('button')).toBeNull();
  });
});
