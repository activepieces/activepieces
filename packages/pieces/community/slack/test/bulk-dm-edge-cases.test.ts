import { AppConnectionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type PostArgs = { channel?: unknown };

const calls: PostArgs[] = [];
const behaviours = new Map<string, () => never>();
let concurrentNow = 0;
let concurrentPeak = 0;
let latencyMs = 0;

function slackError(code: string): never {
  const error: Error & { code?: string; data?: { ok: false; error: string } } = new Error(
    `slack rejected: ${code}`,
  );
  error.code = 'slack_webapi_platform_error';
  error.data = { ok: false, error: code };
  throw error;
}

function timeoutError(): never {
  const original: Error & { code?: string; request?: unknown } = new Error(
    'timeout of 10000ms exceeded',
  );
  original.code = 'ECONNABORTED';
  original.request = {};

  const error: Error & { code?: string; original?: unknown } = new Error(
    `A request error occurred: ${original.message}`,
  );
  error.code = 'slack_webapi_request_error';
  error.original = original;
  throw error;
}

function connectionResetError(): never {
  const original: Error & { code?: string; request?: unknown } = new Error('socket hang up');
  original.code = 'ECONNRESET';
  original.request = {};

  const error: Error & { code?: string; original?: unknown } = new Error(
    `A request error occurred: ${original.message}`,
  );
  error.code = 'slack_webapi_request_error';
  error.original = original;
  throw error;
}

vi.mock('@slack/web-api', () => ({
  WebClient: class {
    chat = {
      postMessage: async (args: PostArgs) => {
        calls.push(args);
        concurrentNow += 1;
        concurrentPeak = Math.max(concurrentPeak, concurrentNow);
        if (latencyMs > 0) {
          await new Promise((resolve) => setTimeout(resolve, latencyMs));
        }
        concurrentNow -= 1;
        const behaviour = behaviours.get(String(args.channel));
        if (behaviour) {
          behaviour();
        }
        return { ok: true, channel: `D-${String(args.channel)}`, ts: '1.1' };
      },
    };
    conversations = { open: async () => ({ ok: true, channel: { id: 'D0' } }) };
    files = { uploadV2: async () => ({ ok: true }) };
  },
}));

const { slackSendMessageToMultipleUsersAction } = await import(
  '../src/lib/actions/send-message-to-multiple-users'
);
const { DEFAULT_MAX_RECIPIENTS, slackBulkDm } = await import('../src/lib/common/bulk-dm');
const { MAX_ACTION_CONCURRENCY_LIMIT, MIN_ACTION_CONCURRENCY_LIMIT } = await import(
  '../src/lib/common/concurrency'
);

function userIdsFor(count: number): string[] {
  return Array.from({ length: count }, (_unused, index) => `U${String(index).padStart(8, '0')}`);
}

function run(propsValue: Record<string, unknown>) {
  return slackSendMessageToMultipleUsersAction.run({
    auth: { type: AppConnectionType.CUSTOM_AUTH, props: { botToken: 'xoxb-test' } },
    propsValue,
  } as never);
}

function sameMessage(userIds: string[], concurrency?: number) {
  return {
    mode: 'same_message',
    recipients: { userIds, text: 'hello' },
    ...(concurrency === undefined ? {} : { concurrency }),
  };
}

beforeEach(() => {
  calls.length = 0;
  behaviours.clear();
  concurrentNow = 0;
  concurrentPeak = 0;
  latencyMs = 0;
});

describe('recipient count boundaries', () => {
  it('sends to a single recipient', async () => {
    const output = await run(sameMessage(userIdsFor(1)));

    expect(output.summary).toEqual({ total: 1, sentCount: 1, failedCount: 0 });
    expect(calls).toHaveLength(1);
  });

  it('sends to exactly the maximum allowed recipients', async () => {
    const output = await run(sameMessage(userIdsFor(DEFAULT_MAX_RECIPIENTS)));

    expect(output.summary.total).toBe(DEFAULT_MAX_RECIPIENTS);
    expect(output.summary.sentCount).toBe(DEFAULT_MAX_RECIPIENTS);
    expect(calls).toHaveLength(DEFAULT_MAX_RECIPIENTS);
  });

  it('rejects one over the maximum and sends nothing at all', async () => {
    await expect(run(sameMessage(userIdsFor(DEFAULT_MAX_RECIPIENTS + 1)))).rejects.toThrow(
      `at most ${DEFAULT_MAX_RECIPIENTS} users`,
    );
    expect(calls).toHaveLength(0);
  });

  it('lowers the cap with the concurrency and issues no request when it is exceeded', async () => {
    const capAtOne = slackBulkDm.maxRecipientsForLimit({ limit: MIN_ACTION_CONCURRENCY_LIMIT });

    expect(capAtOne).toBeLessThan(DEFAULT_MAX_RECIPIENTS);

    await expect(
      run(sameMessage(userIdsFor(capAtOne + 1), MIN_ACTION_CONCURRENCY_LIMIT)),
    ).rejects.toThrow('Raise Parallel Sends');
    expect(calls).toHaveLength(0);
  });

  it('accepts exactly the cap the chosen concurrency allows', async () => {
    const capAtOne = slackBulkDm.maxRecipientsForLimit({ limit: MIN_ACTION_CONCURRENCY_LIMIT });

    const output = await run(sameMessage(userIdsFor(capAtOne), MIN_ACTION_CONCURRENCY_LIMIT));

    expect(output.summary.sentCount).toBe(capAtOne);
  });

  it('counts the cap after dedupe, so duplicates do not consume the budget', async () => {
    const atCap = userIdsFor(DEFAULT_MAX_RECIPIENTS);
    const withDuplicates = [...atCap, ...atCap.slice(0, 10)];

    const output = await run(sameMessage(withDuplicates));

    expect(output.summary.total).toBe(DEFAULT_MAX_RECIPIENTS);
    expect(calls).toHaveLength(DEFAULT_MAX_RECIPIENTS);
  });
});

describe('concurrency settings at the action boundary', () => {
  it('honours the minimum concurrency of 1', async () => {
    latencyMs = 5;

    await run(sameMessage(userIdsFor(6), MIN_ACTION_CONCURRENCY_LIMIT));

    expect(concurrentPeak).toBe(1);
  });

  it('honours the maximum concurrency of 20', async () => {
    latencyMs = 5;

    await run(sameMessage(userIdsFor(40), MAX_ACTION_CONCURRENCY_LIMIT));

    expect(concurrentPeak).toBe(MAX_ACTION_CONCURRENCY_LIMIT);
  });

  it('clamps an over-max request down to 20 rather than obeying it', async () => {
    latencyMs = 5;

    await run(sameMessage(userIdsFor(60), 500));

    expect(concurrentPeak).toBe(MAX_ACTION_CONCURRENCY_LIMIT);
  });

  it('clamps zero and negative up to 1', async () => {
    latencyMs = 5;

    await run(sameMessage(userIdsFor(4), 0));
    expect(concurrentPeak).toBe(1);

    concurrentPeak = 0;
    await run(sameMessage(userIdsFor(4), -3));
    expect(concurrentPeak).toBe(1);
  });

  it('defaults to 5 when the prop is omitted', async () => {
    latencyMs = 5;

    await run(sameMessage(userIdsFor(30)));

    expect(concurrentPeak).toBe(5);
  });

  it('never exceeds the limit even when every send fails', async () => {
    latencyMs = 5;
    const ids = userIdsFor(30);
    for (const id of ids) {
      behaviours.set(id, () => slackError('channel_not_found'));
    }

    await run(sameMessage(ids, 5));

    expect(concurrentPeak).toBe(5);
  });
});

describe('Slack API error codes', () => {
  const perUserCodes = [
    'channel_not_found',
    'user_not_found',
    'user_not_visible',
    'is_bot',
    'cannot_dm_bot',
    'msg_too_long',
    'invalid_blocks',
    'ratelimited',
    'internal_error',
    'service_unavailable',
    'fatal_error',
  ];

  it.each(perUserCodes)('surfaces %s in failed[] without failing the step', async (code) => {
    behaviours.set('U00000001', () => slackError(code));

    const output = await run(sameMessage(['U00000000', 'U00000001', 'U00000002']));

    expect(output.summary).toEqual({ total: 3, sentCount: 2, failedCount: 1 });
    expect(output.failed).toEqual([{ userId: 'U00000001', error: code }]);
  });

  const authCodes = [
    'invalid_auth',
    'not_authed',
    'account_inactive',
    'token_revoked',
    'token_expired',
    'missing_scope',
    'no_permission',
    'ekm_access_denied',
  ];

  it.each(authCodes)('throws when %s is the only failure mode', async (code) => {
    const ids = userIdsFor(3);
    for (const id of ids) {
      behaviours.set(id, () => slackError(code));
    }

    await expect(run(sameMessage(ids))).rejects.toThrow('because of the connection');
  });

  it.each(authCodes)('does not throw when %s is mixed with a success', async (code) => {
    behaviours.set('U00000001', () => slackError(code));

    const output = await run(sameMessage(['U00000000', 'U00000001']));

    expect(output.summary).toEqual({ total: 2, sentCount: 1, failedCount: 1 });
  });

  it('normalizes an unrecognized error shape rather than leaking it', async () => {
    behaviours.set('U00000000', () => {
      throw 'a bare string, not an Error';
    });

    const output = await run(sameMessage(['U00000000', 'U00000001']));

    expect(output.failed).toEqual([{ userId: 'U00000000', error: 'unknown_error' }]);
  });
});

describe('timeout behaviour', () => {
  it('a timed-out request lands in failed[] and the others still complete', async () => {
    behaviours.set('U00000001', () => timeoutError());

    const output = await run(sameMessage(userIdsFor(4)));

    expect(output.summary).toEqual({ total: 4, sentCount: 3, failedCount: 1 });
    expect(output.failed[0].userId).toBe('U00000001');
    expect(output.failed[0].error).toBe('timeout');
  });

  it('leaves other request errors under their original code', async () => {
    behaviours.set('U00000001', () => connectionResetError());

    const output = await run(sameMessage(userIdsFor(2)));

    expect(output.failed[0].error).toBe('slack_webapi_request_error');
  });

  it('every request timing out still returns a result rather than throwing', async () => {
    const ids = userIdsFor(5);
    for (const id of ids) {
      behaviours.set(id, () => timeoutError());
    }

    const output = await run(sameMessage(ids));

    expect(output.summary).toEqual({ total: 5, sentCount: 0, failedCount: 5 });
    expect(output.sent).toEqual([]);
  });
});

describe('step outcome: partial versus complete failure', () => {
  it('partial failure resolves, so the step succeeds', async () => {
    behaviours.set('U00000001', () => slackError('channel_not_found'));

    await expect(run(sameMessage(userIdsFor(3)))).resolves.toBeDefined();
  });

  it('complete failure for per-user reasons still resolves', async () => {
    const ids = userIdsFor(3);
    for (const id of ids) {
      behaviours.set(id, () => slackError('channel_not_found'));
    }

    await expect(run(sameMessage(ids))).resolves.toMatchObject({
      summary: { total: 3, sentCount: 0, failedCount: 3 },
    });
  });

  it('complete failure for connection reasons rejects', async () => {
    const ids = userIdsFor(3);
    for (const id of ids) {
      behaviours.set(id, () => slackError('invalid_auth'));
    }

    await expect(run(sameMessage(ids))).rejects.toThrow();
  });
});

describe('duplicate recipients', () => {
  it('the same recipient three times receives one DM', async () => {
    const output = await run(sameMessage(['U00000000', 'U00000000', 'U00000000']));

    expect(calls).toHaveLength(1);
    expect(output.summary).toEqual({ total: 1, sentCount: 1, failedCount: 0 });
  });

  it('a duplicate that fails appears once in failed[]', async () => {
    behaviours.set('U00000000', () => slackError('channel_not_found'));

    const output = await run(sameMessage(['U00000000', 'U00000000']));

    expect(output.failed).toEqual([{ userId: 'U00000000', error: 'channel_not_found' }]);
  });
});
