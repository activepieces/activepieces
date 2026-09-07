import { McpOAuthGrant } from '@activepieces/shared';
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  default: { language: 'en-US' },
  t: (key: string, params?: Record<string, unknown>) =>
    params ? `${key}:${JSON.stringify(params)}` : key,
}));

const { grantUtils } = await import(
  '@/app/routes/mcp-server/grants/grant-utils'
);

const NOW = new Date('2025-09-15T12:00:00Z');

function grant(lastUsedAt: string | null): McpOAuthGrant {
  return { lastUsedAt } as McpOAuthGrant;
}

describe('grantUtils.formatLastUsed', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
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
    const sameDay = dayjs(NOW).startOf('day').add(30, 'minute');

    expect(grantUtils.formatLastUsed(grant(sameDay.toISOString()))).toEqual({
      label: 'Active today',
      isActiveToday: true,
    });
  });

  it('names the date for any earlier day, never a relative time', () => {
    const earlier = dayjs(NOW).subtract(34, 'day');
    const result = grantUtils.formatLastUsed(grant(earlier.toISOString()));

    expect(result.isActiveToday).toBe(false);
    expect(result.label).toContain('Last used {date}');
    expect(result.label).toContain(earlier.format('MMM D'));
  });
});
