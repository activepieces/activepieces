import { describe, expect, it } from 'vitest';
import {
  slackBulkDm,
  SLACK_MAX_BLOCKS_PER_MESSAGE,
  DEFAULT_MAX_RECIPIENTS,
} from '../src/lib/common/bulk-dm';
import {
  slackConcurrency,
  DEFAULT_ACTION_CONCURRENCY_LIMIT,
  FLOW_TIMEOUT_DEFAULT_MS,
  MAX_ACTION_CONCURRENCY_LIMIT,
  MIN_ACTION_CONCURRENCY_LIMIT,
} from '../src/lib/common/concurrency';
import { Block, KnownBlock } from '@slack/web-api';

const {
  buildSendPlan,
  maxRecipientsForLimit,
  validateSendPlan,
  validateMessagePayload,
  assertBlockCountWithinLimit,
  summarize,
} = slackBulkDm;

const { roundsWithinFlowBudget, worstCaseMsPerRecipient } = slackConcurrency;

function sections(count: number): (KnownBlock | Block)[] {
  return Array.from({ length: count }, () => ({
    type: 'section',
    text: { type: 'mrkdwn', text: 'x' },
  })) as (KnownBlock | Block)[];
}

function recipientsFor(count: number): { userId: string }[] {
  return Array.from({ length: count }, (_unused, index) => ({
    userId: `U${String(index).padStart(8, '0')}`,
  }));
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
    expect(() => validateSendPlan({ recipients: [], limit: DEFAULT_ACTION_CONCURRENCY_LIMIT })).toThrow(
      'at least one user',
    );
  });

  it('rejects a plan over the recipient cap and names the limit', () => {
    const cap = maxRecipientsForLimit({ limit: DEFAULT_ACTION_CONCURRENCY_LIMIT });
    const recipients = recipientsFor(cap + 1);

    expect(() => validateSendPlan({ recipients, limit: DEFAULT_ACTION_CONCURRENCY_LIMIT })).toThrow(
      `at most ${cap} users`,
    );
  });

  it('accepts a plan exactly at the cap', () => {
    const recipients = recipientsFor(maxRecipientsForLimit({ limit: DEFAULT_ACTION_CONCURRENCY_LIMIT }));

    expect(() =>
      validateSendPlan({ recipients, limit: DEFAULT_ACTION_CONCURRENCY_LIMIT }),
    ).not.toThrow();
  });

  it('rejects a channel ID pasted where a user ID belongs', () => {
    expect(() =>
      validateSendPlan({ recipients: [{ userId: 'C0123ABCD' }], limit: DEFAULT_ACTION_CONCURRENCY_LIMIT }),
    ).toThrow('valid Slack user ID');
  });

  it('rejects an email address', () => {
    expect(() =>
      validateSendPlan({
        recipients: [{ userId: 'someone@example.com' }],
        limit: DEFAULT_ACTION_CONCURRENCY_LIMIT,
      }),
    ).toThrow('valid Slack user ID');
  });

  it('accepts both U- and W-prefixed IDs', () => {
    expect(() =>
      validateSendPlan({
        recipients: [{ userId: 'U012AB3CD' }, { userId: 'W012AB3CD' }],
        limit: DEFAULT_ACTION_CONCURRENCY_LIMIT,
      }),
    ).not.toThrow();
  });
});

describe('the recipient cap is tied to the concurrency', () => {
  it('gives every parallel send a fixed share of the flow budget', () => {
    for (const limit of [1, 2, 3, 4, 5]) {
      expect(maxRecipientsForLimit({ limit })).toBe(
        Math.min(DEFAULT_MAX_RECIPIENTS, roundsWithinFlowBudget() * limit),
      );
    }
  });

  it('still allows the full cap at the default concurrency', () => {
    expect(maxRecipientsForLimit({ limit: DEFAULT_ACTION_CONCURRENCY_LIMIT })).toBe(
      DEFAULT_MAX_RECIPIENTS,
    );
  });

  it('never exceeds the hard cap however high the concurrency goes', () => {
    expect(maxRecipientsForLimit({ limit: MAX_ACTION_CONCURRENCY_LIMIT })).toBe(DEFAULT_MAX_RECIPIENTS);
  });

  it('keeps the worst case inside the flow budget at every concurrency', () => {
    for (let limit = MIN_ACTION_CONCURRENCY_LIMIT; limit <= MAX_ACTION_CONCURRENCY_LIMIT; limit += 1) {
      const rounds = Math.ceil(maxRecipientsForLimit({ limit }) / limit);

      expect(rounds * worstCaseMsPerRecipient()).toBeLessThanOrEqual(FLOW_TIMEOUT_DEFAULT_MS);
    }
  });

  it('tells the user to raise Parallel Sends when the concurrency is what binds', () => {
    const recipients = recipientsFor(maxRecipientsForLimit({ limit: 1 }) + 1);

    expect(() => validateSendPlan({ recipients, limit: 1 })).toThrow('Raise Parallel Sends');
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
