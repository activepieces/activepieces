/**
 * @vitest-environment jsdom
 *
 * Regression test for https://github.com/activepieces/activepieces/issues/13555
 * (GIT-1530): in embed mode, hosts can hide every navigation surface, but the
 * global search palette still opened via CMD+K / Ctrl+K and let users navigate
 * to any page, flow, or table on their own. When the embedding state sets
 * `hideGlobalSearch`, the provider must neither register the keyboard shortcut
 * nor render the palette dialog at all.
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

vi.mock('@/components/ui/dialog', () => ({
  Dialog: ({ open, children }: React.PropsWithChildren<{ open: boolean }>) =>
    open ? <div data-testid="global-search-dialog">{children}</div> : null,
  DialogContent: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
  DialogTitle: ({ children }: React.PropsWithChildren) => (
    <div>{children}</div>
  ),
}));

vi.mock('@/app/components/global-search/style-spotlight', () => ({
  StyleSpotlight: () => null,
}));

vi.mock('@/app/components/global-search/use-browse-controller', () => ({
  useBrowseController: () => ({}),
}));

import { GlobalSearchProvider } from '@/app/components/global-search/global-search-context';
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

function renderProvider({
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
        <GlobalSearchProvider>
          <div />
        </GlobalSearchProvider>
      </EmbeddingProvider>,
    );
  });
}

function pressSearchShortcut(modifier: 'metaKey' | 'ctrlKey') {
  act(() => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', [modifier]: true }),
    );
  });
}

function findDialog() {
  return document.querySelector('[data-testid="global-search-dialog"]');
}

afterEach(() => {
  act(() => root?.unmount());
  container?.remove();
  root = null;
  container = null;
});

describe('GlobalSearchProvider', () => {
  it('opens the palette on CMD+K outside embed mode', () => {
    renderProvider();
    expect(findDialog()).toBeNull();

    pressSearchShortcut('metaKey');

    expect(findDialog()).not.toBeNull();
  });

  it('keeps the palette available in embed mode when hideGlobalSearch is off', () => {
    renderProvider({ hideGlobalSearch: false });

    pressSearchShortcut('metaKey');

    expect(findDialog()).not.toBeNull();
  });

  it('ignores CMD+K when hideGlobalSearch is set', () => {
    renderProvider({ hideGlobalSearch: true });

    pressSearchShortcut('metaKey');

    expect(findDialog()).toBeNull();
  });

  it('ignores Ctrl+K when hideGlobalSearch is set', () => {
    renderProvider({ hideGlobalSearch: true });

    pressSearchShortcut('ctrlKey');

    expect(findDialog()).toBeNull();
  });
});
