// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { completeTakeOver, completeTakeOverWithFeedback } from '@/hooks/use-resource-lock';


describe('completeTakeOver', () => {
  it('uses the embed callback instead of hard reloading when embedded', async () => {
    const onTakeOver = vi.fn().mockResolvedValue(undefined);
    const reload = vi.fn();

    await completeTakeOver({
      isEmbedded: true,
      onTakeOver,
      reload,
    });

    expect(onTakeOver).toHaveBeenCalledTimes(1);
    expect(reload).not.toHaveBeenCalled();
  });

  it('falls back to reload outside embed mode', async () => {
    const reload = vi.fn();

    await completeTakeOver({
      isEmbedded: false,
      onTakeOver: undefined,
      reload,
    });

    expect(reload).toHaveBeenCalledTimes(1);
  });

  it('propagates embed callback errors', async () => {
    const reload = vi.fn();
    const onTakeOver = vi.fn().mockRejectedValue(new Error('boom'));

    await expect(
      completeTakeOver({
        isEmbedded: true,
        onTakeOver,
        reload,
      }),
    ).rejects.toThrow('boom');

    expect(reload).not.toHaveBeenCalled();
  });

  it('calls onSuccess only after takeover refresh succeeds', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await completeTakeOverWithFeedback({
      isEmbedded: true,
      onTakeOver: vi.fn().mockResolvedValue(undefined),
      reload: vi.fn(),
      onSuccess,
      onError,
    });

    expect(onSuccess).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
  });

  it('calls onError without clearing success when takeover refresh fails', async () => {
    const onSuccess = vi.fn();
    const onError = vi.fn();

    await completeTakeOverWithFeedback({
      isEmbedded: true,
      onTakeOver: vi.fn().mockRejectedValue(new Error('boom')),
      reload: vi.fn(),
      onSuccess,
      onError,
    });

    expect(onError).toHaveBeenCalledTimes(1);
    expect(onSuccess).not.toHaveBeenCalled();
  });
});
