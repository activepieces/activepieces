import { PopulatedMcpActivity } from '@activepieces/shared';
import { describe, expect, it, vi } from 'vitest';

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

describe('activityUtils.parseOutput', () => {
  it('splits the summary line from the JSON result', () => {
    const output = [
      {
        type: 'text',
        text: '✅ Add Row completed (run r1).\n\n{\n  "row": 7\n}',
      },
    ];

    expect(activityUtils.parseOutput(output)).toEqual({
      summary: 'Add Row completed (run r1).',
      data: { row: 7 },
    });
  });

  it('keeps a non-JSON remainder as text', () => {
    const output = [{ type: 'text', text: '✅ Done.\n\nnot json' }];

    expect(activityUtils.parseOutput(output)).toEqual({
      summary: 'Done.',
      data: 'not json',
    });
  });

  it('passes through output that is not an MCP text result', () => {
    const output = { ok: true };

    expect(activityUtils.parseOutput(output)).toEqual({
      summary: null,
      data: { ok: true },
    });
  });
});

describe('activityUtils.actionInput', () => {
  it('returns only the action input from an ap_run_action call', () => {
    const input = {
      pieceName: 'slack',
      actionName: 'send_channel_message',
      input: { channel: 'C1' },
      connectionExternalId: 'slack-acme',
    };

    expect(activityUtils.actionInput(input)).toEqual({ channel: 'C1' });
  });

  it('returns any other input unchanged', () => {
    expect(activityUtils.actionInput({ key: 'value' })).toEqual({
      key: 'value',
    });
  });
});

describe('activityUtils.errorText', () => {
  it('drops the retry hint meant for the agent and the status mark', () => {
    const message =
      '❌ Add Row failed (run r1): 403.\n\nRetry suggestion: check the connection.';

    expect(activityUtils.errorText(message)).toBe(
      'Add Row failed (run r1): 403.',
    );
  });

  it('keeps every other paragraph', () => {
    const message = '❌ Failed.\n\nDetails line.';

    expect(activityUtils.errorText(message)).toBe('Failed.\n\nDetails line.');
  });
});

describe('activityUtils.memberName', () => {
  it('joins first and last name', () => {
    expect(
      activityUtils.memberName({
        firstName: 'Lena',
        lastName: 'Fischer',
        email: 'lena@acme.test',
      }),
    ).toBe('Lena Fischer');
  });

  it('falls back to the email when there is no name', () => {
    expect(
      activityUtils.memberName({
        firstName: '',
        lastName: '',
        email: 'lena@acme.test',
      }),
    ).toBe('lena@acme.test');
  });
});

describe('activityUtils.resolveSelection', () => {
  const rows = [activity({ id: 'first' }), activity({ id: 'last' })];

  it('keeps the selected row while the next page is loading', () => {
    const previous = activity({ id: 'previous-page-row' });

    expect(
      activityUtils.resolveSelection({
        selection: { row: previous, pending: { cursor: 'c2', edge: 'first' } },
        rows,
        cursor: 'c2',
        isPlaceholderData: true,
      }),
    ).toBe(previous);
  });

  it('lands on the first row of the next page', () => {
    expect(
      activityUtils.resolveSelection({
        selection: {
          row: activity({ id: 'x' }),
          pending: { cursor: 'c2', edge: 'first' },
        },
        rows,
        cursor: 'c2',
        isPlaceholderData: false,
      })?.id,
    ).toBe('first');
  });

  it('lands on the last row of the previous page', () => {
    expect(
      activityUtils.resolveSelection({
        selection: {
          row: activity({ id: 'x' }),
          pending: { cursor: 'c0', edge: 'last' },
        },
        rows,
        cursor: 'c0',
        isPlaceholderData: false,
      })?.id,
    ).toBe('last');
  });

  it('ignores a pending move while the URL still points at the old page', () => {
    const previous = activity({ id: 'x' });

    expect(
      activityUtils.resolveSelection({
        selection: { row: previous, pending: { cursor: 'c2', edge: 'first' } },
        rows,
        cursor: 'c1',
        isPlaceholderData: false,
      }),
    ).toBe(previous);
  });
});
