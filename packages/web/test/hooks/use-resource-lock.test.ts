// @vitest-environment jsdom
import { describe, expect, it, vi } from 'vitest';

import { completeTakeOver } from '@/hooks/use-resource-lock';

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
});
