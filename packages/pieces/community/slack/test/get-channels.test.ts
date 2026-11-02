import { AppConnectionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const calls: { method: string; params: Record<string, unknown> }[] = [];
let pages: { channels: { id: string; name: string }[]; next?: string }[] = [];

vi.mock('@slack/web-api', () => ({
  WebClient: class {
    conversations = {
      list: async (params: Record<string, unknown>) => nextPage({ method: 'conversations.list', params }),
    };
    users = {
      conversations: async (params: Record<string, unknown>) => nextPage({ method: 'users.conversations', params }),
    };
  },
}));

import { getChannels, onlyBotChannels, slackChannel, slackChannels } from '../src/lib/common/props';

const auth = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: { botToken: 'xoxb-test' },
};

function nextPage(call: { method: string; params: Record<string, unknown> }) {
  calls.push(call);
  const page = pages[calls.length - 1] ?? { channels: [] };
  return { channels: page.channels, response_metadata: { next_cursor: page.next ?? '' } };
}

function channelsOf({ count, prefix }: { count: number; prefix: string }) {
  return Array.from({ length: count }, (_, i) => ({ id: `${prefix}${i}`, name: `${prefix}-${i}` }));
}

describe('channel listing', () => {
  beforeEach(() => {
    calls.length = 0;
    pages = [{ channels: [{ id: 'C1', name: 'general' }] }];
  });

  it('checkbox defaults to on', () => {
    expect(onlyBotChannels.defaultValue).toBe(true);
  });

  it('lists only the bot channels via users.conversations when the toggle is on', async () => {
    const channels = await getChannels({ accessToken: 'xoxb-test', onlyBotChannels: true });

    expect(calls.map((c) => c.method)).toEqual(['users.conversations']);
    expect(channels).toEqual([{ label: 'general', value: 'C1' }]);
  });

  it('lists all channels via conversations.list when the toggle is off or unset', async () => {
    await getChannels({ accessToken: 'xoxb-test', onlyBotChannels: false });
    await getChannels({ accessToken: 'xoxb-test' });

    expect(calls.map((c) => c.method)).toEqual(['conversations.list', 'conversations.list']);
  });

  it('follows next_cursor and stops at the 2000 channel cap', async () => {
    pages = [
      { channels: channelsOf({ count: 1000, prefix: 'A' }), next: 'cursor-1' },
      { channels: channelsOf({ count: 1000, prefix: 'B' }), next: 'cursor-2' },
      { channels: channelsOf({ count: 1000, prefix: 'C' }), next: 'cursor-3' },
    ];

    const channels = await getChannels({ accessToken: 'xoxb-test', onlyBotChannels: true });

    expect(channels).toHaveLength(2000);
    expect(calls).toHaveLength(2);
    expect(calls[1].params.cursor).toBe('cursor-1');
  });

  it('stops when there is no next cursor', async () => {
    pages = [{ channels: channelsOf({ count: 3, prefix: 'A' }) }];

    const channels = await getChannels({ accessToken: 'xoxb-test' });

    expect(channels).toHaveLength(3);
    expect(calls).toHaveLength(1);
  });

  describe.each([
    ['slackChannel', slackChannel(true)],
    ['slackChannels', slackChannels],
  ])('%s dropdown', (_name, prop) => {
    it('refreshes on the toggle', () => {
      expect(prop.refreshers).toEqual(['onlyBotChannels']);
    });

    it('uses users.conversations only when the toggle is exactly true', async () => {
      await prop.options({ auth, onlyBotChannels: true }, {});
      await prop.options({ auth, onlyBotChannels: false }, {});
      await prop.options({ auth }, {});

      expect(calls.map((c) => c.method)).toEqual([
        'users.conversations',
        'conversations.list',
        'conversations.list',
      ]);
    });

    it('is disabled without a connection', async () => {
      const result = await prop.options({ onlyBotChannels: true }, {});

      expect(result.disabled).toBe(true);
      expect(calls).toHaveLength(0);
    });
  });
});
