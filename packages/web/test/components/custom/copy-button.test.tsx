/**
 * @vitest-environment jsdom
 */
import * as React from 'react';
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({ t: (key: string) => key }));

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

// eslint-disable-next-line import/first
import { CopyButton } from '@/components/custom/clipboard/copy-button';

declare global {
  // eslint-disable-next-line no-var
  var IS_REACT_ACT_ENVIRONMENT: boolean;
}

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('CopyButton', () => {
  let root: Root | undefined;
  let container: HTMLDivElement;

  beforeEach(() => {
    vi.clearAllMocks();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    act(() => root?.unmount());
    container.remove();
    document.body.innerHTML = '';
  });

  it('renders and copies text to clipboard without QueryClientProvider', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    act(() => {
      root = createRoot(container);
      root.render(
        <CopyButton
          textToCopy="test diagnostics text"
          withoutTooltip
          data-testid="copy-btn"
        />,
      );
    });

    const btn = container.querySelector('button');
    expect(btn).not.toBeNull();

    await act(async () => {
      btn?.click();
    });

    expect(writeTextMock).toHaveBeenCalledWith('test diagnostics text');
  });

  it('falls back gracefully on clipboard error without crashing', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard denied'));
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    act(() => {
      root = createRoot(container);
      root.render(
        <CopyButton
          textToCopy="failure text"
          withoutTooltip
          data-testid="copy-btn-fail"
        />,
      );
    });

    const btn = container.querySelector('button');
    expect(btn).not.toBeNull();

    await act(async () => {
      btn?.click();
    });

    expect(writeTextMock).toHaveBeenCalledWith('failure text');
  });
});
