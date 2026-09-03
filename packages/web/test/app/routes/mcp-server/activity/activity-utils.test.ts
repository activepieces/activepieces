import { PopulatedMcpActivity } from '@activepieces/shared';
import dayjs from 'dayjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('i18next', () => ({
  default: { language: 'en-US' },
  t: (key: string) => key,
}));

const { activityUtils } = await import(
  '@/app/routes/mcp-server/activity/activity-utils'
);

const NOON_ON_A_TUESDAY = new Date('2026-08-18T12:00:00Z');

function activity(
  overrides: Partial<PopulatedMcpActivity>,
): PopulatedMcpActivity {
  return {
    id: 'a1',
    created: NOON_ON_A_TUESDAY.toISOString(),
    status: 'SUCCEEDED',
    toolName: 'ap_run_action',
    clientKey: 'claude-code',
    member: null,
    projectId: 'p1',
    projectName: 'Marketing',
    pieceName: '@activepieces/piece-slack',
    actionName: 'send_channel_message',
    connectionExternalId: 'conn-1',
    connectionDisplayName: null,
    errorMessage: null,
    durationMs: 1200,
    hasPayload: true,
    ...overrides,
  };
}

describe('activityUtils.formatWhen', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOON_ON_A_TUESDAY);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows a clock for today', () => {
    const at = dayjs().hour(14).minute(32);

    expect(activityUtils.formatWhen(at.toISOString())).toBe('Today · 14:32');
  });

  it('names yesterday rather than counting hours', () => {
    const at = dayjs().subtract(1, 'day').hour(16).minute(44);

    expect(activityUtils.formatWhen(at.toISOString())).toBe(
      'Yesterday · 16:44',
    );
  });

  it('dates anything older', () => {
    const at = dayjs().subtract(6, 'day').hour(9).minute(3);

    expect(activityUtils.formatWhen(at.toISOString())).toBe(
      `${at.format('MMM D')} · 09:03`,
    );
  });

  it('reads a local clock, not UTC', () => {
    const at = dayjs().hour(0).minute(5);

    expect(activityUtils.formatWhen(at.toISOString())).toBe('Today · 00:05');
  });
});

describe('activityUtils.formatRan', () => {
  it('prefers the resolved display names', () => {
    const ran = activityUtils.formatRan({
      row: activity({}),
      actionDisplayName: 'Send Message',
      pieceDisplayName: 'Slack',
    });

    expect(ran).toEqual({ action: 'Send Message', piece: 'Slack' });
  });

  it('humanises the machine name when the action does not resolve', () => {
    const ran = activityUtils.formatRan({
      row: activity({}),
      actionDisplayName: undefined,
      pieceDisplayName: 'Slack',
    });

    expect(ran).toEqual({ action: 'Send Channel Message', piece: 'Slack' });
  });

  it('keeps a hallucinated piece name visible rather than blanking the cell', () => {
    const ran = activityUtils.formatRan({
      row: activity({ pieceName: '@acme/piece-invented' }),
      actionDisplayName: undefined,
      pieceDisplayName: undefined,
    });

    expect(ran).toEqual({
      action: 'Send Channel Message',
      piece: '@acme/piece-invented',
    });
  });
});

describe('activityUtils.formatAccount', () => {
  it('names the connection when it resolved', () => {
    expect(
      activityUtils.formatAccount(
        activity({ connectionDisplayName: 'Slack — #general' }),
      ),
    ).toBe('Slack — #general');
  });

  it('falls back to the id the client asked for', () => {
    expect(
      activityUtils.formatAccount(
        activity({ connectionExternalId: 'hallucinated' }),
      ),
    ).toBe('hallucinated');
  });
});
