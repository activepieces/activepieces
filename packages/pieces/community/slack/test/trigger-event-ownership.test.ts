import { afterEach, describe, expect, it, vi } from 'vitest';
import { newDirectMessageTrigger } from '../src/lib/triggers/new-direct-message';
import { newMessageTrigger } from '../src/lib/triggers/new-message';
import { newSavedMessageTrigger } from '../src/lib/triggers/new-saved-message';

const slackApi = vi.hoisted(() => ({
  conversationsVisibleToToken: new Map<string, Set<string>>(),
  outage: false,
}));

vi.mock('@slack/web-api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@slack/web-api')>();
  class WebClient {
    constructor(private readonly token: string) {}
    conversations = {
      info: async ({ channel }: { channel: string }) => answerSlackCall({ token: this.token, channel }),
      history: async ({ channel }: { channel: string }) => answerSlackCall({ token: this.token, channel }),
    };
  }
  return { ...original, WebClient };
});

const BOT_TOKEN = 'xoxb-workspace-bot';
const USER_B_TOKEN = 'xoxp-user-b';

slackApi.conversationsVisibleToToken.set(BOT_TOKEN, new Set(['C0PUBLIC', 'D0C_BOT', 'G0BOTIN']));
slackApi.conversationsVisibleToToken.set(USER_B_TOKEN, new Set(['C0PUBLIC', 'D0B_C', 'G0B']));

describe("Slack triggers on user B's connection only fire for events B's connection can see", () => {
  afterEach(() => {
    slackApi.outage = false;
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

  it("fires 'New Public Message Posted Anywhere' for a public channel message", async () => {
    expect(await newMessageTrigger.run(triggerContext({ event: channelMessage({ channel: 'C0PUBLIC', channelType: 'channel' }) }))).toHaveLength(1);
  });

  it("fires 'New Public Message Posted Anywhere' for a private channel the app's bot is in", async () => {
    expect(await newMessageTrigger.run(triggerContext({ event: channelMessage({ channel: 'G0BOTIN', channelType: 'group' }) }))).toHaveLength(1);
  });

  it("does not fire 'New Public Message Posted Anywhere' for A's private channel that B and the bot are not in", async () => {
    expect(await newMessageTrigger.run(triggerContext({ event: channelMessage({ channel: 'G0A', channelType: 'group' }) }))).toEqual([]);
  });

  it('throws instead of reporting no events when Slack has an outage', async () => {
    slackApi.outage = true;
    await expect(newDirectMessageTrigger.run(triggerContext({ event: directMessage({ channel: 'D0B_C', user: 'UC' }) }))).rejects.toThrow('internal_error');
  });
});

function answerSlackCall({ token, channel }: { token: string; channel: string }) {
  if (slackApi.outage) {
    throw slackPlatformError('internal_error');
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

function triggerContext({ event }: { event: Record<string, unknown> }) {
  return Object.assign(Object.create(null), {
    auth: {
      type: 'OAUTH2',
      access_token: BOT_TOKEN,
      data: {
        team: { id: 'T0WORK' },
        bot_user_id: 'UBOT',
        authed_user: { id: 'UB', access_token: USER_B_TOKEN },
      },
    },
    propsValue: { ignoreBots: false, ignoreSelfMessages: false },
    payload: {
      method: 'POST',
      headers: {},
      queryParams: {},
      body: { type: 'event_callback', team_id: 'T0WORK', event },
    },
  });
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
