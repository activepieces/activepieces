import { AppConnectionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type PostArgs = {
  channel?: unknown;
  text?: unknown;
  blocks?: unknown;
  username?: unknown;
  icon_url?: unknown;
  icon_emoji?: unknown;
};

const calls: PostArgs[] = [];
const behaviours = new Map<string, () => never>();
const clientOptions: (Record<string, unknown> | undefined)[] = [];

function slackError({ code, retries }: { code: string; retries?: number }) {
  const error: Error & { code?: string; data?: { ok: false; error: string } } = new Error(
    `slack rejected: ${code}`,
  );
  error.code = 'slack_webapi_platform_error';
  error.data = { ok: false, error: code };
  if (retries !== undefined) {
    Object.assign(error, { retriesExhausted: retries });
  }
  throw error;
}

vi.mock('@slack/web-api', () => ({
  WebClient: class {
    constructor(_token: string, options?: Record<string, unknown>) {
      clientOptions.push(options);
    }

    chat = {
      postMessage: async (args: PostArgs) => {
        calls.push(args);
        const behaviour = behaviours.get(String(args.channel));
        if (behaviour) {
          behaviour();
        }
        return { ok: true, channel: `D-${String(args.channel)}`, ts: `ts-${String(args.channel)}` };
      },
    };
    conversations = { open: async () => ({ ok: true, channel: { id: 'D0123ABCD' } }) };
    files = { uploadV2: async () => ({ ok: true }) };
  },
}));

const { slackSendMessageToMultipleUsersAction } = await import(
  '../src/lib/actions/send-message-to-multiple-users'
);
const { slackConcurrency, FLOW_TIMEOUT_DEFAULT_MS } = await import('../src/lib/common/concurrency');

const auth = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: { botToken: 'xoxb-secret-token-value' },
};

function runAction(propsValue: Record<string, unknown>) {
  return slackSendMessageToMultipleUsersAction.run({
    auth,
    propsValue,
    files: { write: async () => 'unused' },
    server: { token: 't', apiUrl: 'http://localhost', publicUrl: 'http://localhost' },
    run: { id: 'run-1', stop: () => undefined, pause: () => undefined },
    flows: { current: { id: 'flow-1', version: { id: 'v1' } } },
    project: { id: 'p1', externalId: undefined },
  } as never);
}

function sameMessageProps(userIds: string[], overrides: Record<string, unknown> = {}) {
  return {
    mode: 'same_message',
    recipients: { userIds, text: 'standup in 5' },
    concurrency: 2,
    ...overrides,
  };
}

beforeEach(() => {
  calls.length = 0;
  clientOptions.length = 0;
  behaviours.clear();
});

describe('partial success under sustained rate limiting', () => {
  it('keeps the successes, fails only the rate-limited users, and returns instead of hanging', async () => {
    behaviours.set('U00000000C', () => slackError({ code: 'ratelimited', retries: 5 }));
    behaviours.set('U00000000E', () => slackError({ code: 'ratelimited', retries: 5 }));

    const started = Date.now();
    const output = await runAction(
      sameMessageProps(['U00000000A', 'U00000000B', 'U00000000C', 'U00000000D', 'U00000000E']),
    );
    const elapsed = Date.now() - started;

    expect(output.sent.map((entry) => entry.userId)).toEqual([
      'U00000000A',
      'U00000000B',
      'U00000000D',
    ]);
    expect(output.failed).toEqual([
      { userId: 'U00000000C', error: 'ratelimited' },
      { userId: 'U00000000E', error: 'ratelimited' },
    ]);
    expect(output.summary).toEqual({ total: 5, sentCount: 3, failedCount: 2 });
    expect(elapsed).toBeLessThan(5_000);
    expect(calls).toHaveLength(5);
  });

  it('carries channel and ts for the successful sends', async () => {
    const output = await runAction(sameMessageProps(['U00000000A']));

    expect(output.sent[0]).toEqual({
      userId: 'U00000000A',
      channel: 'D-U00000000A',
      ts: 'ts-U00000000A',
    });
  });
});

describe('failure isolation', () => {
  it('one failure does not stop the others', async () => {
    behaviours.set('U00000000B', () => slackError({ code: 'user_not_found' }));

    const output = await runAction(sameMessageProps(['U00000000A', 'U00000000B', 'U00000000C']));

    expect(output.summary).toEqual({ total: 3, sentCount: 2, failedCount: 1 });
    expect(output.failed).toEqual([{ userId: 'U00000000B', error: 'user_not_found' }]);
  });

  it('all failing for per-user reasons still succeeds, with everything in failed', async () => {
    for (const userId of ['U00000000A', 'U00000000B']) {
      behaviours.set(userId, () => slackError({ code: 'user_not_found' }));
    }

    const output = await runAction(sameMessageProps(['U00000000A', 'U00000000B']));

    expect(output.sent).toEqual([]);
    expect(output.summary).toEqual({ total: 2, sentCount: 0, failedCount: 2 });
  });

  it('throws when every send failed for an auth reason, because that is a broken connection', async () => {
    for (const userId of ['U00000000A', 'U00000000B']) {
      behaviours.set(userId, () => slackError({ code: 'invalid_auth' }));
    }

    await expect(runAction(sameMessageProps(['U00000000A', 'U00000000B']))).rejects.toThrow(
      'because of the connection',
    );
  });

  it('does not throw when an auth failure is mixed with a success', async () => {
    behaviours.set('U00000000B', () => slackError({ code: 'missing_scope' }));

    const output = await runAction(sameMessageProps(['U00000000A', 'U00000000B']));

    expect(output.summary).toEqual({ total: 2, sentCount: 1, failedCount: 1 });
    expect(output.failed).toEqual([{ userId: 'U00000000B', error: 'missing_scope' }]);
  });
});

describe('non-retryable errors are surfaced once', () => {
  it('calls Slack exactly once for a user_not_found recipient', async () => {
    behaviours.set('U00000000A', () => slackError({ code: 'user_not_found' }));

    await runAction(sameMessageProps(['U00000000A']));

    expect(calls.filter((call) => call.channel === 'U00000000A')).toHaveLength(1);
  });
});

describe('output safety', () => {
  it('leaks neither the token nor the message body into the failure output', async () => {
    behaviours.set('U00000000B', () => slackError({ code: 'user_not_found' }));

    const output = await runAction(
      sameMessageProps(['U00000000A', 'U00000000B'], {
        recipients: { userIds: ['U00000000A', 'U00000000B'], text: 'confidential payroll note' },
      }),
    );

    const serializedFailures = JSON.stringify(output.failed);

    expect(serializedFailures).not.toContain('xoxb-secret-token-value');
    expect(serializedFailures).not.toContain('confidential payroll note');
    expect(serializedFailures).not.toContain('slack rejected');
  });
});

describe('pre-send validation blocks the whole run', () => {
  it('sends nothing when the recipient list is empty', async () => {
    await expect(runAction(sameMessageProps([]))).rejects.toThrow('at least one user');
    expect(calls).toHaveLength(0);
  });

  it('sends nothing when a user ID is malformed', async () => {
    await expect(runAction(sameMessageProps(['U00000000A', 'C0123ABCD']))).rejects.toThrow(
      'valid Slack user ID',
    );
    expect(calls).toHaveLength(0);
  });

  it('sends nothing when neither a message nor blocks are given', async () => {
    await expect(
      runAction({ mode: 'same_message', recipients: { userIds: ['U00000000A'] }, concurrency: 2 }),
    ).rejects.toThrow('Either Message or Block Kit blocks must be provided');
    expect(calls).toHaveLength(0);
  });

  it('sends nothing when a personal entry is missing its message', async () => {
    await expect(
      runAction({
        mode: 'personal_message',
        recipients: {
          personalMessages: [{ userId: 'U00000000A', text: 'ok' }, { userId: 'U00000000B' }],
        },
      }),
    ).rejects.toThrow('Entry 2 is missing a message.');
    expect(calls).toHaveLength(0);
  });
});

describe('send plan reaches Slack as configured', () => {
  it('dedupes before sending, so a repeated user gets one DM', async () => {
    await runAction(sameMessageProps(['U00000000A', 'U00000000B', 'U00000000A']));

    expect(calls).toHaveLength(2);
  });

  it('personal mode sends each recipient their own text', async () => {
    await runAction({
      mode: 'personal_message',
      recipients: {
        personalMessages: [
          { userId: 'U00000000A', text: 'yours' },
          { userId: 'U00000000B', text: 'theirs' },
        ],
      },
      concurrency: 2,
    });

    expect(calls.map((call) => [call.channel, call.text])).toEqual([
      ['U00000000A', 'yours'],
      ['U00000000B', 'theirs'],
    ]);
  });

  it('sends blocks-only when no text is given', async () => {
    await runAction({
      mode: 'same_message',
      recipients: { userIds: ['U00000000A'] },
      blocks: [{ type: 'divider' }],
      concurrency: 2,
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].text).toBeUndefined();
    expect(calls[0].blocks).toEqual([{ type: 'divider' }]);
  });
});

describe('the SDK client is bounded, not left on its defaults', () => {
  it('passes a non-zero request timeout and a bounded retry policy', async () => {
    await runAction(sameMessageProps(['U00000000A']));

    const options = clientOptions.at(-1);
    expect(options).toBeDefined();
    expect(options?.['timeout']).toBeGreaterThan(0);

    const retryConfig = options?.['retryConfig'] as Record<string, unknown>;
    expect(retryConfig).toBeDefined();
    expect(retryConfig['retries']).toBeLessThan(10);
    expect(retryConfig['randomize']).toBe(true);
    expect(retryConfig['maxTimeout']).toBeGreaterThan(0);
  });

  it('accounts for the randomized backoff when costing a recipient', async () => {
    await runAction(sameMessageProps(['U00000000A']));

    const options = clientOptions.at(-1);
    const retryConfig = options?.['retryConfig'] as Record<string, unknown>;
    const timeoutMs = Number(options?.['timeout']);
    const retries = Number(retryConfig['retries']);
    const minTimeoutMs = Number(retryConfig['minTimeout']);
    const maxTimeoutMs = Number(retryConfig['maxTimeout']);
    const factor = Number(retryConfig['factor']);

    const randomizedBackoffMs = Array.from({ length: retries }, (_unused, attempt) =>
      Math.min(2 * minTimeoutMs * factor ** attempt, maxTimeoutMs),
    ).reduce((total, backoff) => total + backoff, 0);

    expect(slackConcurrency.worstCaseMsPerRecipient()).toBe(
      timeoutMs * (retries + 1) + randomizedBackoffMs,
    );
  });

  it('leaves headroom under the flow timeout for a full round of sends', async () => {
    expect(
      slackConcurrency.roundsWithinFlowBudget() * slackConcurrency.worstCaseMsPerRecipient(),
    ).toBeLessThanOrEqual(FLOW_TIMEOUT_DEFAULT_MS);
  });
});

describe('sender customization reaches Slack', () => {
  it('forwards username, profile picture and icon emoji to every recipient', async () => {
    await runAction({
      mode: 'same_message',
      recipients: { userIds: ['U00000000A', 'U00000000B'], text: 'hi' },
      username: 'Standup Bot',
      profilePicture: 'https://example.com/avatar.png',
      iconEmoji: ':robot_face:',
      concurrency: 2,
    });

    expect(calls).toHaveLength(2);
    for (const call of calls) {
      expect(call.username).toBe('Standup Bot');
      expect(call.icon_url).toBe('https://example.com/avatar.png');
      expect(call.icon_emoji).toBe(':robot_face:');
    }
  });

  it('sends no sender overrides when the props are left empty', async () => {
    await runAction(sameMessageProps(['U00000000A']));

    expect(calls[0].username).toBeUndefined();
    expect(calls[0].icon_url).toBeUndefined();
    expect(calls[0].icon_emoji).toBeUndefined();
  });
});
