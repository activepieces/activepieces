import { describe, expect, it } from 'vitest';
import {
  slackBulkDm,
  SLACK_MAX_BLOCKS_PER_MESSAGE,
  DEFAULT_MAX_RECIPIENTS,
} from '../src/lib/common/bulk-dm';
import { Block, KnownBlock } from '@slack/web-api';

const {
  buildSendPlan,
  validateSendPlan,
  validateMessagePayload,
  assertBlockCountWithinLimit,
  summarize,
} = slackBulkDm;

function sections(count: number): (KnownBlock | Block)[] {
  return Array.from({ length: count }, () => ({
    type: 'section',
    text: { type: 'mrkdwn', text: 'x' },
  })) as (KnownBlock | Block)[];
}

describe('buildSendPlan — same-message mode', () => {
  it('maps every selected user to one send carrying the shared text', () => {
    const plan = buildSendPlan({
      mode: 'same_message',
      userIds: ['U111', 'U222', 'U333'],
      text: 'standup in 5',
    });

    expect(plan).toEqual([
      { userId: 'U111', text: 'standup in 5' },
      { userId: 'U222', text: 'standup in 5' },
      { userId: 'U333', text: 'standup in 5' },
    ]);
  });

  it('trims whitespace around dynamic user IDs', () => {
    const plan = buildSendPlan({ mode: 'same_message', userIds: [' U111 '], text: 'hi' });

    expect(plan[0].userId).toBe('U111');
  });

  it('rejects a non-list of users, which is what a bad dynamic value produces', () => {
    expect(() => buildSendPlan({ mode: 'same_message', userIds: 'U111', text: 'hi' })).toThrow();
    expect(() => buildSendPlan({ mode: 'same_message', userIds: undefined, text: 'hi' })).toThrow();
  });

  it('rejects a non-string entry inside the user list', () => {
    expect(() =>
      buildSendPlan({ mode: 'same_message', userIds: ['U111', 42], text: 'hi' }),
    ).toThrow();
  });

  it('carries no text when the message is blocks-only', () => {
    const plan = buildSendPlan({ mode: 'same_message', userIds: ['U111'] });

    expect(plan).toEqual([{ userId: 'U111', text: undefined }]);
  });
});

describe('buildSendPlan — personal-message mode', () => {
  it('carries each recipient own message', () => {
    const plan = buildSendPlan({
      mode: 'personal_message',
      personalMessages: [
        { userId: 'U111', text: 'yours' },
        { userId: 'U222', text: 'theirs' },
      ],
    });

    expect(plan).toEqual([
      { userId: 'U111', text: 'yours' },
      { userId: 'U222', text: 'theirs' },
    ]);
  });

  it('rejects an entry missing its message, naming the entry, before any send', () => {
    expect(() =>
      buildSendPlan({
        mode: 'personal_message',
        personalMessages: [
          { userId: 'U111', text: 'ok' },
          { userId: 'U222' },
        ],
      }),
    ).toThrow('Entry 2 is missing a message.');
  });

  it('rejects an entry missing its user', () => {
    expect(() =>
      buildSendPlan({ mode: 'personal_message', personalMessages: [{ text: 'orphan' }] }),
    ).toThrow('Entry 1 is missing a user.');
  });

  it('rejects a blank message, not just an absent one', () => {
    expect(() =>
      buildSendPlan({ mode: 'personal_message', personalMessages: [{ userId: 'U111', text: '   ' }] }),
    ).toThrow();
  });

  it('rejects a non-list', () => {
    expect(() => buildSendPlan({ mode: 'personal_message', personalMessages: undefined })).toThrow();
  });
});

describe('buildSendPlan — dedupe', () => {
  it('collapses a repeated user in same-message mode', () => {
    const plan = buildSendPlan({
      mode: 'same_message',
      userIds: ['U111', 'U222', 'U111'],
      text: 'once',
    });

    expect(plan).toHaveLength(2);
    expect(plan.map((entry) => entry.userId)).toEqual(['U111', 'U222']);
  });

  it('last write wins, so a later personal message overrides an earlier one', () => {
    const plan = buildSendPlan({
      mode: 'personal_message',
      personalMessages: [
        { userId: 'U111', text: 'first' },
        { userId: 'U111', text: 'second' },
      ],
    });

    expect(plan).toEqual([{ userId: 'U111', text: 'second' }]);
  });
});

describe('buildSendPlan — mode', () => {
  it('rejects an unknown mode', () => {
    expect(() =>
      buildSendPlan({
        mode: 'broadcast' as never,
        userIds: ['U111'],
        text: 'hi',
      }),
    ).toThrow('Unknown mode');
  });
});

describe('validateSendPlan', () => {
  it('rejects an empty plan', () => {
    expect(() => validateSendPlan({ recipients: [], maxRecipients: DEFAULT_MAX_RECIPIENTS })).toThrow(
      'at least one user',
    );
  });

  it('rejects a plan over the recipient cap and names the limit', () => {
    const recipients = Array.from({ length: 4 }, (_unused, index) => ({ userId: `U${index}00` }));

    expect(() => validateSendPlan({ recipients, maxRecipients: 3 })).toThrow('at most 3 users');
  });

  it('accepts a plan exactly at the cap', () => {
    const recipients = Array.from({ length: 3 }, (_unused, index) => ({ userId: `U${index}00` }));

    expect(() => validateSendPlan({ recipients, maxRecipients: 3 })).not.toThrow();
  });

  it('rejects a channel ID pasted where a user ID belongs', () => {
    expect(() =>
      validateSendPlan({ recipients: [{ userId: 'C0123ABCD' }], maxRecipients: DEFAULT_MAX_RECIPIENTS }),
    ).toThrow('valid Slack user ID');
  });

  it('rejects an email address', () => {
    expect(() =>
      validateSendPlan({
        recipients: [{ userId: 'someone@example.com' }],
        maxRecipients: DEFAULT_MAX_RECIPIENTS,
      }),
    ).toThrow('valid Slack user ID');
  });

  it('accepts both U- and W-prefixed IDs', () => {
    expect(() =>
      validateSendPlan({
        recipients: [{ userId: 'U012AB3CD' }, { userId: 'W012AB3CD' }],
        maxRecipients: DEFAULT_MAX_RECIPIENTS,
      }),
    ).not.toThrow();
  });
});

describe('validateMessagePayload', () => {
  it('accepts text only', () => {
    expect(() => validateMessagePayload({ text: 'hello' })).not.toThrow();
  });

  it('accepts blocks only, matching the single-user action', () => {
    expect(() => validateMessagePayload({ blocks: sections(1) })).not.toThrow();
  });

  it('accepts text and blocks together', () => {
    expect(() => validateMessagePayload({ text: 'hello', blocks: sections(1) })).not.toThrow();
  });

  it('rejects neither', () => {
    expect(() => validateMessagePayload({})).toThrow('Either Message or Block Kit blocks must be provided');
  });

  it('rejects whitespace-only text with no blocks', () => {
    expect(() => validateMessagePayload({ text: '   ' })).toThrow();
  });

  it('rejects an empty blocks array with no text', () => {
    expect(() => validateMessagePayload({ blocks: [] })).toThrow();
  });
});

describe('assertBlockCountWithinLimit', () => {
  it('accepts a payload at the Slack limit', () => {
    expect(() => assertBlockCountWithinLimit(sections(SLACK_MAX_BLOCKS_PER_MESSAGE))).not.toThrow();
  });

  it('rejects one block over the limit before any send happens', () => {
    expect(() => assertBlockCountWithinLimit(sections(SLACK_MAX_BLOCKS_PER_MESSAGE + 1))).toThrow(
      'at most 50 blocks',
    );
  });

  it('reports the assembled count, so the message says what to shorten', () => {
    expect(() => assertBlockCountWithinLimit(sections(64))).toThrow('builds 64');
  });
});

describe('summarize', () => {
  it('counts a mixed result', () => {
    const summary = summarize({
      sent: [
        { userId: 'U111', channel: 'D111', ts: '1.1' },
        { userId: 'U222', channel: 'D222', ts: '2.2' },
      ],
      failed: [{ userId: 'U333', error: 'user_not_found' }],
    });

    expect(summary).toEqual({ total: 3, sentCount: 2, failedCount: 1 });
  });

  it('counts an all-failed result', () => {
    const summary = summarize({
      sent: [],
      failed: [
        { userId: 'U111', error: 'user_not_found' },
        { userId: 'U222', error: 'user_not_found' },
      ],
    });

    expect(summary).toEqual({ total: 2, sentCount: 0, failedCount: 2 });
  });

  it('counts an all-sent result', () => {
    const summary = summarize({ sent: [{ userId: 'U111' }], failed: [] });

    expect(summary).toEqual({ total: 1, sentCount: 1, failedCount: 0 });
  });
});
