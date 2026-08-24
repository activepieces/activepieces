import { McpOAuthGrant } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

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
  it('says never used when the client has not refreshed once', () => {
    expect(grantUtils.formatLastUsed(grant(null))).toEqual({
      label: 'Never used',
      isActiveToday: false,
    });
  });

  it('says active today for a refresh earlier the same day', () => {
    const earlierToday = new Date();
    earlierToday.setHours(0, 30, 0, 0);

    expect(
      grantUtils.formatLastUsed(grant(earlierToday.toISOString())),
    ).toEqual({ label: 'Active today', isActiveToday: true });
  });

  it('names the date for any earlier day, never a relative time', () => {
    const lastMonth = new Date('2025-08-12T09:00:00.000Z');

    const result = grantUtils.formatLastUsed(grant(lastMonth.toISOString()));

    expect(result.isActiveToday).toBe(false);
    expect(result.label).toContain('Last used {date}');
    expect(result.label).toContain('Aug 12');
  });
});
