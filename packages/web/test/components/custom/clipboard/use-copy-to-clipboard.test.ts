/**
 * @vitest-environment jsdom
 */
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const { toastError } = vi.hoisted(() => ({ toastError: vi.fn() }));

vi.mock('i18next', () => ({ t: (key: string) => key }));
vi.mock('sonner', () => ({ toast: { error: toastError } }));

import { useCopyToClipboard } from '@/components/custom/clipboard/use-copy-to-clipboard';

function setClipboard(clipboard: Partial<Clipboard> | undefined) {
  Object.defineProperty(navigator, 'clipboard', {
    value: clipboard,
    configurable: true,
  });
}

describe('useCopyToClipboard', () => {
  beforeEach(() => {
    toastError.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('copies the text and resets the copied state after 3 seconds', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    setClipboard({ writeText });
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      result.current.copy('hello');
    });

    expect(writeText).toHaveBeenCalledWith('hello');
    expect(result.current.isCopied).toBe(true);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(result.current.isCopied).toBe(false);
  });

  it('shows the failure toast when the clipboard is unavailable', async () => {
    setClipboard(undefined);
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      expect(() => result.current.copy('hello')).not.toThrow();
    });

    expect(toastError).toHaveBeenCalledWith('Failed to copy to clipboard', {
      duration: 3000,
    });
    expect(result.current.isCopied).toBe(false);
  });

  it('shows the failure toast when writing is rejected', async () => {
    setClipboard({ writeText: vi.fn().mockRejectedValue(new Error('denied')) });
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      result.current.copy('hello');
    });

    expect(toastError).toHaveBeenCalledTimes(1);
    expect(result.current.isCopied).toBe(false);
  });
});
