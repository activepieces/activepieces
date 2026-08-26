import { McpOAuthGrant } from '@activepieces/shared';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  default: { language: 'en-US' },
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

const { grantUtils } = await import(
  '@/app/routes/mcp-server/connections/grant-utils'
);

function grant(lastUsedAt: string | null): McpOAuthGrant {
  return { lastUsedAt } as McpOAuthGrant;
}

describe('grantUtils.formatLastUsed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-09-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('says never used when the client has not refreshed once', () => {
    expect(grantUtils.formatLastUsed(grant(null))).toEqual({
      label: 'Never used',
      isActiveToday: false,
    });
  });

  it('says active today for a refresh earlier the same day', () => {
    expect(
      grantUtils.formatLastUsed(grant('2025-09-15T00:30:00Z')),
    ).toEqual({ label: 'Active today', isActiveToday: true });
  });

  it('names the date for any earlier day, never a relative time', () => {
    const result = grantUtils.formatLastUsed(grant('2025-08-12T09:00:00Z'));

    expect(result.isActiveToday).toBe(false);
    expect(result.label).toContain('Last used {date}');
    expect(result.label).toContain('Aug 12');
  });
});
