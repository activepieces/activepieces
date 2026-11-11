import { describe, expect, it, vi } from 'vitest';

const visibleTo = new Map<string, Set<string>>([
  ['xoxb-workspace-bot', new Set(['C0PUBLIC', 'D0C_BOT', 'G0BOTIN'])],
  ['xoxp-user-b', new Set(['C0PUBLIC', 'D0B_C', 'G0B'])],
]);

vi.mock('@slack/web-api', async (importOriginal) => {
  const original = await importOriginal<typeof import('@slack/web-api')>();
  class WebClient {
    constructor(private readonly token?: string) {}
    conversations = {
      info: async ({ channel }: { channel: string }) => this.read(channel),
      history: async ({ channel }: { channel: string }) => this.read(channel),
    };
    read(channel: string) {
      if (visibleTo.get(this.token ?? '')?.has(channel)) {
        return { ok: true };
      }
      if (channel === 'G0DOWN') {
        throw Object.assign(new Error('An API error occurred: internal_error'), {
          code: original.ErrorCode.PlatformError,
          data: { ok: false, error: 'internal_error' },
        });
      }
      throw Object.assign(new Error('An API error occurred: channel_not_found'), {
        code: original.ErrorCode.PlatformError,
        data: { ok: false, error: 'channel_not_found' },
      });
    }
  }
  return { ...original, WebClient };
});

import { newSavedMessageTrigger } from '../src/lib/triggers/new-saved-message';
import { newDirectMessageTrigger } from '../src/lib/triggers/new-direct-message';
import { newMessageTrigger } from '../src/lib/triggers/new-message';
import { newMessageInChannelTrigger } from '../src/lib/triggers/new-message-in-channel';
import { newMentionInDirectMessageTrigger } from '../src/lib/triggers/new-mention-in-direct-message';

const connectionB = {
  type: 'OAUTH2',
  access_token: 'xoxb-workspace-bot',
  data: {
    team: { id: 'T0WORK' },
    bot_user_id: 'UBOT',
    authed_user: { id: 'UB', access_token: 'xoxp-user-b' },
  },
};

function ctx({ propsValue, event }: { propsValue: Record<string, unknown>; event: Record<string, unknown> }) {
  return {
    auth: connectionB,
    propsValue,
    payload: { method: 'POST', headers: {}, queryParams: {}, body: { team_id: 'T0WORK', type: 'event_callback', event } },
  } as never;
}

function savedBy(user: string) {
  return {
    type: 'star_added',
    user,
    item: { type: 'message', channel: 'D0A_C', message: { type: 'message', user: 'UC', text: 'saved', ts: '1790000000.000100' } },
    event_ts: '1790000000.000200',
  };
}

function message({ channel, channelType, user, text }: { channel: string; channelType: string; user: string; text?: string }) {
  return { type: 'message', channel, channel_type: channelType, user, text: text ?? 'hi', ts: '1790000001.000100' };
}

const dmProps = { ignoreBots: false, ignoreSelfMessages: false };

describe('Slack triggers only fire for events the connection can see', () => {
  it('fires New Saved Message for the connected user own save', async () => {
    expect(await newSavedMessageTrigger.run(ctx({ propsValue: {}, event: savedBy('UB') }))).toHaveLength(1);
  });

  it('ignores a message saved by another workspace user', async () => {
    expect(await newSavedMessageTrigger.run(ctx({ propsValue: {}, event: savedBy('UA') }))).toEqual([]);
  });

  it('fires New Direct Message for a DM the connected user is in', async () => {
    const event = message({ channel: 'D0B_C', channelType: 'im', user: 'UC' });
    expect(await newDirectMessageTrigger.run(ctx({ propsValue: dmProps, event }))).toHaveLength(1);
  });

  it('fires New Direct Message for a DM to the app bot', async () => {
    const event = message({ channel: 'D0C_BOT', channelType: 'im', user: 'UC' });
    expect(await newDirectMessageTrigger.run(ctx({ propsValue: dmProps, event }))).toHaveLength(1);
  });

  it('ignores a DM between two other users', async () => {
    const event = message({ channel: 'D0A_C', channelType: 'im', user: 'UA' });
    expect(await newDirectMessageTrigger.run(ctx({ propsValue: dmProps, event }))).toEqual([]);
  });

  it('ignores a mention in a DM between two other users', async () => {
    const event = message({ channel: 'D0A_C', channelType: 'im', user: 'UA', text: 'hey <@UB>' });
    expect(await newMentionInDirectMessageTrigger.run(ctx({ propsValue: { ...dmProps, user: 'UB' }, event }))).toEqual([]);
  });

  it('fires New Public Message for a public channel message', async () => {
    const event = message({ channel: 'C0PUBLIC', channelType: 'channel', user: 'UA' });
    expect(await newMessageTrigger.run(ctx({ propsValue: { ignoreBots: false }, event }))).toHaveLength(1);
  });

  it('fires New Public Message for a private channel the bot is in', async () => {
    const event = message({ channel: 'G0BOTIN', channelType: 'group', user: 'UC' });
    expect(await newMessageTrigger.run(ctx({ propsValue: { ignoreBots: false }, event }))).toHaveLength(1);
  });

  it('ignores a private channel neither the bot nor the user is in', async () => {
    const event = message({ channel: 'G0A', channelType: 'group', user: 'UA' });
    expect(await newMessageTrigger.run(ctx({ propsValue: { ignoreBots: false }, event }))).toEqual([]);
  });

  it('fails the run instead of dropping the event when Slack has an internal error', async () => {
    const event = message({ channel: 'G0DOWN', channelType: 'group', user: 'UC' });
    await expect(newMessageTrigger.run(ctx({ propsValue: { ignoreBots: false }, event }))).rejects.toThrow('internal_error');
  });

  it('ignores New Message In Channel for a private channel id the connection cannot see', async () => {
    const event = message({ channel: 'G0A', channelType: 'group', user: 'UA' });
    expect(await newMessageInChannelTrigger.run(ctx({ propsValue: { ignoreBots: false, channel: 'G0A' }, event }))).toEqual([]);
  });
});
