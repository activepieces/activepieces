import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/authentication-session', () => ({
  authenticationSession: { getCurrentUserId: () => 'user-1' },
}));
vi.mock('@/app/routes/mcp-server/mcp-grants-hooks', () => ({
  mcpGrantsQueries: { useAllGrants: vi.fn() },
}));

const { connectWatchUtils } = await import(
  '@/app/routes/mcp-server/connect/use-connect-home'
);

const NOW = 1_000_000;

describe('connectWatchUtils.isWatching', () => {
  it('watches while a client setup is open, even when no tile was clicked', () => {
    expect(
      connectWatchUtils.isWatching({
        until: null,
        isSetupOpen: true,
        now: NOW,
      }),
    ).toBe(true);
  });

  it('keeps watching after a tile click until the window ends', () => {
    expect(
      connectWatchUtils.isWatching({
        until: NOW + 1,
        isSetupOpen: false,
        now: NOW,
      }),
    ).toBe(true);
    expect(
      connectWatchUtils.isWatching({
        until: NOW - 1,
        isSetupOpen: false,
        now: NOW,
      }),
    ).toBe(false);
  });

  it('does not watch on the stage when nothing started it', () => {
    expect(
      connectWatchUtils.isWatching({
        until: null,
        isSetupOpen: false,
        now: NOW,
      }),
    ).toBe(false);
  });
});
