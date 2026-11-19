import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { newDirectMessageTrigger } from '../src/lib/triggers/new-direct-message';
import { newMessageTrigger } from '../src/lib/triggers/new-message';
import { newSavedMessageTrigger } from '../src/lib/triggers/new-saved-message';

const slackApi = vi.hoisted(() => ({
  conversationsVisibleToToken: new Map<string, Set<string>>(),
  tokensWithoutReadScopes: new Set<string>(),
  calls: [] as { token: string; method: string; channel: string }[],
  clientOptions: [] as Record<string, unknown>[],
  failure: undefined as 'outage' | 'rateLimited' | undefined,
}));

vi.mock('@slack/web-api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@slack/web-api')>();
  class WebClient {
    constructor(private readonly token: string, options: Record<string, unknown> = {}) {
      slackApi.clientOptions.push(options);
    }
    conversations = {
      info: async ({ channel }: { channel: string }) => answerSlackCall({ token: this.token, method: 'info', channel }),
      history: async ({ channel }: { channel: string }) => answerSlackCall({ token: this.token, method: 'history', channel }),
    };
  }
  return { ...original, WebClient };
});

const BOT_TOKEN = 'xoxb-workspace-bot';
const USER_B_TOKEN = 'xoxp-user-b';
const USER_D_TOKEN = 'xoxp-user-d';
const CUSTOM_BOT_TOKEN = 'xoxb-custom-bot-without-read-scopes';
const TRIGGER_TIMEOUT_MS = 60_000;
const TRIGGER_BUDGET_HEADROOM_MS = 15_000;
const MAX_SLACK_CALLS_PER_CHECK = 3;

slackApi.conversationsVisibleToToken.set(BOT_TOKEN, new Set(['C0PUBLIC', 'D0C_BOT', 'G0BOTIN']));
slackApi.conversationsVisibleToToken.set(USER_B_TOKEN, new Set(['C0PUBLIC', 'D0B_C', 'G0B']));
slackApi.conversationsVisibleToToken.set(USER_D_TOKEN, new Set(['C0PUBLIC']));
slackApi.conversationsVisibleToToken.set(CUSTOM_BOT_TOKEN, new Set(['D0C_BOT', 'G0BOTIN']));
slackApi.tokensWithoutReadScopes.add(USER_B_TOKEN);
slackApi.tokensWithoutReadScopes.add(USER_D_TOKEN);
slackApi.tokensWithoutReadScopes.add(CUSTOM_BOT_TOKEN);

describe("Slack triggers on user B's connection only fire for events B's connection can see", () => {
  beforeEach(() => {
    slackApi.calls.length = 0;
    slackApi.clientOptions.length = 0;
  });

  afterEach(() => {
    slackApi.failure = undefined;
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it("fires 'New Saved Message' for a message B saved", async () => {
    expect(await newSavedMessageTrigger.run(triggerContext({ event: savedBy('UB') }))).toHaveLength(1);
  });

  it("does not fire 'New Saved Message' for a message A saved", async () => {
    expect(await newSavedMessageTrigger.run(triggerContext({ event: savedBy('UA') }))).toEqual([]);
  });

  it("fires 'New Direct Message' for a DM between C and B", async () => {
    expect(await newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0B_C', user: 'UC' }) }))).toHaveLength(1);
  });

  it("fires 'New Direct Message' for a DM from C to the app's bot", async () => {
    expect(await newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0C_BOT', user: 'UC' }) }))).toHaveLength(1);
  });

  it("does not fire 'New Direct Message' for a private DM between A and C", async () => {
    expect(await newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0A_C', user: 'UA' }) }))).toEqual([]);
  });

  it("fires 'New Public Message Posted Anywhere' for a public channel message without asking Slack", async () => {
    expect(await newMessageTrigger.run(triggerContext({ event: channelMessage({ channel: 'C0PUBLIC', channelType: 'channel' }) }))).toHaveLength(1);
    expect(slackApi.calls).toEqual([]);
  });

  it("fires 'New Public Message Posted Anywhere' for a private channel the app's bot is in", async () => {
    expect(await newMessageTrigger.run(triggerContext({ event: channelMessage({ channel: 'G0BOTIN', channelType: 'group' }) }))).toHaveLength(1);
  });

  it("does not fire 'New Public Message Posted Anywhere' for A's private channel that B and the bot are not in", async () => {
    expect(await newMessageTrigger.run(triggerContext({ event: channelMessage({ channel: 'G0A', channelType: 'group' }) }))).toEqual([]);
  });

  it('fires without asking Slack when the event names the connected user', async () => {
    const event = directMessage({ channel: 'D0B_C', user: 'UC' });
    expect(await newDirectMessageTrigger.run(triggerContext({ event, authorizations: [slackAuthorization({ userId: 'UB' })] }))).toHaveLength(1);
    expect(slackApi.calls).toEqual([]);
  });

  it('fires without asking Slack when the event names the connection bot', async () => {
    const event = channelMessage({ channel: 'G0BOTIN', channelType: 'group' });
    expect(await newMessageTrigger.run(triggerContext({ event, authorizations: [slackAuthorization({ userId: 'UBOT', isBot: true })] }))).toHaveLength(1);
    expect(slackApi.calls).toEqual([]);
  });

  it('still asks Slack when the event names an installation without a user', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, user_id: 'UCUSTOMBOT' })));
    const event = channelMessage({ channel: 'G0A', channelType: 'group' });
    expect(await newMessageTrigger.run(triggerContext({ event, authorizations: [slackAuthorization({ userId: undefined })], connection: customBotConnection() }))).toEqual([]);
    expect(slackApi.calls.length).toBeGreaterThan(0);
  });

  it('still asks Slack when the event names someone else', async () => {
    const event = directMessage({ channel: 'D0A_C', user: 'UA' });
    expect(await newDirectMessageTrigger.run(triggerContext({ event, authorizations: [slackAuthorization({ userId: 'UA' })] }))).toEqual([]);
    expect(slackApi.calls.length).toBeGreaterThan(0);
  });

  it('asks the bot with conversations.info and the user with conversations.history', async () => {
    await newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0B_C', user: 'UC' }) }));
    expect(slackApi.calls).toEqual([
      { token: BOT_TOKEN, method: 'info', channel: 'D0B_C' },
      { token: USER_B_TOKEN, method: 'history', channel: 'D0B_C' },
    ]);
  });

  it('asks Slack once for repeated messages in the same DM', async () => {
    const store = inMemoryStore();
    await newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0B_C', user: 'UC' }), store }));
    const callsAfterFirstMessage = slackApi.calls.length;
    expect(await newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0B_C', user: 'UC' }), store }))).toHaveLength(1);
    expect(slackApi.calls.length).toBe(callsAfterFirstMessage);
  });

  it('remembers a no as well as a yes', async () => {
    const store = inMemoryStore();
    await newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0A_C', user: 'UA' }), store }));
    const callsAfterFirstMessage = slackApi.calls.length;
    expect(await newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0A_C', user: 'UA' }), store }))).toEqual([]);
    expect(slackApi.calls.length).toBe(callsAfterFirstMessage);
  });

  it('asks Slack again once a private-channel answer is older than two minutes', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const store = inMemoryStore();
    const event = channelMessage({ channel: 'G0B', channelType: 'group' });
    await newMessageTrigger.run(triggerContext({ event, store }));
    const callsAfterFirstMessage = slackApi.calls.length;
    vi.setSystemTime(Date.now() + 2 * 60 * 1000 + 1);
    await newMessageTrigger.run(triggerContext({ event, store }));
    expect(slackApi.calls.length).toBeGreaterThan(callsAfterFirstMessage);
  });

  it('keeps a DM answer for a day', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const store = inMemoryStore();
    const event = directMessage({ channel: 'D0B_C', user: 'UC' });
    await newDirectMessageTrigger.run(triggerContext({ event, store }));
    const callsAfterFirstMessage = slackApi.calls.length;
    vi.setSystemTime(Date.now() + 23 * 60 * 60 * 1000);
    await newDirectMessageTrigger.run(triggerContext({ event, store }));
    expect(slackApi.calls.length).toBe(callsAfterFirstMessage);
  });

  it('asks Slack again once a DM answer is older than a day', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    const store = inMemoryStore();
    const event = directMessage({ channel: 'D0B_C', user: 'UC' });
    await newDirectMessageTrigger.run(triggerContext({ event, store }));
    const callsAfterFirstMessage = slackApi.calls.length;
    vi.setSystemTime(Date.now() + 24 * 60 * 60 * 1000 + 1);
    await newDirectMessageTrigger.run(triggerContext({ event, store }));
    expect(slackApi.calls.length).toBeGreaterThan(callsAfterFirstMessage);
  });

  it("does not reuse B's cached answer after the flow switches to D's connection", async () => {
    const store = inMemoryStore();
    const event = directMessage({ channel: 'D0B_C', user: 'UC' });
    expect(await newDirectMessageTrigger.run(triggerContext({ event, store }))).toHaveLength(1);
    expect(await newDirectMessageTrigger.run(triggerContext({ event, store, connection: userDConnection() }))).toEqual([]);
  });

  it("fires 'New Direct Message' on a bot-only connection whose bot can read the DM but has no read scopes", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, user_id: 'UCUSTOMBOT' })));
    expect(await newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0C_BOT', user: 'UC' }), connection: customBotConnection() }))).toHaveLength(1);
    expect(slackApi.calls).toEqual([
      { token: CUSTOM_BOT_TOKEN, method: 'info', channel: 'D0C_BOT' },
      { token: CUSTOM_BOT_TOKEN, method: 'history', channel: 'D0C_BOT' },
    ]);
  });

  it("does not fire 'New Public Message Posted Anywhere' on a bot-only connection whose bot can't read the private channel", async () => {
    vi.stubGlobal('fetch', vi.fn(async () => Response.json({ ok: true, user_id: 'UCUSTOMBOT' })));
    expect(await newMessageTrigger.run(triggerContext({ event: channelMessage({ channel: 'G0A', channelType: 'group' }), connection: customBotConnection() }))).toEqual([]);
  });

  it('throws instead of reporting no events when Slack has an outage', async () => {
    slackApi.failure = 'outage';
    await expect(newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0B_C', user: 'UC' }) }))).rejects.toThrow('internal_error');
  });

  it('throws at once instead of waiting when Slack rate-limits the check', async () => {
    slackApi.failure = 'rateLimited';
    await expect(newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0B_C', user: 'UC' }) }))).rejects.toThrow('rate limited');
  });

  it("does not cache an answer when Slack couldn't give one", async () => {
    const store = inMemoryStore();
    slackApi.failure = 'outage';
    await expect(newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0B_C', user: 'UC' }), store }))).rejects.toThrow();
    slackApi.failure = undefined;
    expect(await newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0B_C', user: 'UC' }), store }))).toHaveLength(1);
  });

  it('keeps the worst-case check inside the trigger timeout', async () => {
    await newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0B_C', user: 'UC' }) }));
    for (const options of slackApi.clientOptions) {
      expect(options).toMatchObject({ retryConfig: { retries: 0 }, rejectRateLimitedCalls: true });
      expect(Number(options['timeout']) * MAX_SLACK_CALLS_PER_CHECK).toBeLessThanOrEqual(TRIGGER_TIMEOUT_MS - TRIGGER_BUDGET_HEADROOM_MS);
    }
  });
});

function answerSlackCall({ token, method, channel }: { token: string; method: string; channel: string }) {
  slackApi.calls.push({ token, method, channel });
  if (slackApi.failure === 'outage') {
    throw slackPlatformError('internal_error');
  }
  if (slackApi.failure === 'rateLimited') {
    throw Object.assign(new Error('A rate limit was exceeded: rate limited'), { code: 'slack_webapi_rate_limited_error', retryAfter: 60 });
  }
  if (method === 'info' && slackApi.tokensWithoutReadScopes.has(token)) {
    throw slackPlatformError('missing_scope');
  }
  if (slackApi.conversationsVisibleToToken.get(token)?.has(channel)) {
    return { ok: true, channel: { id: channel } };
  }
  throw slackPlatformError('channel_not_found');
}

function slackPlatformError(slackError: string) {
  return Object.assign(new Error(`An API error occurred: ${slackError}`), {
    code: 'slack_webapi_platform_error',
    data: { ok: false, error: slackError },
  });
}

function inMemoryStore() {
  const values = new Map<string, unknown>();
  return {
    get: async (key: string) => values.get(key) ?? null,
    put: async (key: string, value: unknown) => {
      values.set(key, value);
      return value;
    },
    delete: async (key: string) => {
      values.delete(key);
    },
  };
}

function userBConnection() {
  return {
    type: 'OAUTH2',
    access_token: BOT_TOKEN,
    data: { team: { id: 'T0WORK' }, bot_user_id: 'UBOT', authed_user: { id: 'UB', access_token: USER_B_TOKEN } },
  };
}

function userDConnection() {
  return {
    type: 'OAUTH2',
    access_token: BOT_TOKEN,
    data: { team: { id: 'T0WORK' }, bot_user_id: 'UBOT', authed_user: { id: 'UD', access_token: USER_D_TOKEN } },
  };
}

function customBotConnection() {
  return { type: 'CUSTOM_AUTH', props: { botToken: CUSTOM_BOT_TOKEN } };
}

function triggerContext({ event, authorizations, store = inMemoryStore(), connection = userBConnection() }: {
  event: Record<string, unknown>;
  authorizations?: ReturnType<typeof slackAuthorization>[];
  store?: ReturnType<typeof inMemoryStore>;
  connection?: Record<string, unknown>;
}) {
  return Object.assign(Object.create(null), {
    auth: connection,
    store,
    propsValue: { ignoreBots: false, ignoreSelfMessages: false },
    payload: {
      method: 'POST',
      headers: {},
      queryParams: {},
      body: { type: 'event_callback', team_id: 'T0WORK', authorizations, event },
    },
  });
}

function slackAuthorization({ userId, isBot = false }: { userId: string | undefined; isBot?: boolean }) {
  return { enterprise_id: null, team_id: 'T0WORK', user_id: userId, is_bot: isBot, is_enterprise_install: false };
}

function savedBy(user: string) {
  return {
    type: 'star_added',
    user,
    item: { type: 'message', channel: 'D0A_C', message: { type: 'message', user: 'UC', text: `saved by ${user}`, ts: '1790000000.000100' } },
    event_ts: '1790000000.000200',
  };
}

function directMessage({ channel, user }: { channel: string; user: string }) {
  return { type: 'message', channel, channel_type: 'im', user, text: `dm in ${channel}`, ts: '1790000001.000100' };
}

function channelMessage({ channel, channelType }: { channel: string; channelType: string }) {
  return { type: 'message', channel, channel_type: channelType, user: 'UA', text: `message in ${channel}`, ts: '1790000002.000100' };
}
