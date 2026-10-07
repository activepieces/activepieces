import { AppConnectionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';

type RepliesArgs = { channel: string; ts: string; limit?: number; cursor?: string };

const repliesCalls: RepliesArgs[] = [];
let repliesPages: Record<string, { messages: { ts: string; text: string }[]; response_metadata?: { next_cursor?: string } }> = {};

vi.mock('@slack/web-api', () => ({
  WebClient: class {
    conversations = {
      replies: async (args: RepliesArgs) => {
        repliesCalls.push(args);
        return { ok: true, ...repliesPages[args.cursor ?? 'first'] };
      },
    };
  },
}));

const { retrieveThreadMessages } = await import('../src/lib/actions/retrieve-thread-messages');
const { slackGetThreadRepliesAiAction } = await import('../src/lib/actions/get-thread-replies.action');
const { newTeamCustomEmojiTrigger } = await import('../src/lib/triggers/new-team-custom-emoji');
const { newMention } = await import('../src/lib/triggers/new-mention');

const auth = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: { botToken: 'xoxb-test' },
};

function actionContext(propsValue: Record<string, unknown>) {
  return {
    auth,
    propsValue,
    server: { publicUrl: 'https://cloud.activepieces.com/api/' },
    project: { id: 'proj_1' },
    flows: { current: { id: 'flow_1' } },
  };
}

function triggerContext({ event, propsValue = {} }: { event: Record<string, unknown>; propsValue?: Record<string, unknown> }) {
  return {
    auth,
    propsValue,
    payload: { body: { event }, headers: {}, queryParams: {} },
    app: { createListeners: vi.fn() },
  };
}

beforeEach(() => {
  repliesCalls.length = 0;
  repliesPages = {};
});

describe('New Team Custom Emoji only fires on additions', () => {
  it.each([
    ['add', 1],
    ['remove', 0],
    ['rename', 0],
  ])('subtype %s yields %i event(s)', async (subtype, expected) => {
    const event = { type: 'emoji_changed', subtype, name: 'partyparrot', value: 'https://emoji.example/parrot.gif' };
    const result = await newTeamCustomEmojiTrigger.run(triggerContext({ event }) as never);
    expect(result).toHaveLength(expected);
    if (expected === 1) {
      expect(result[0]).toEqual({ id: 'partyparrot', image: 'https://emoji.example/parrot.gif' });
    }
  });

  it('ignores unrelated event types', async () => {
    const event = { type: 'message', subtype: 'add', name: 'x', value: 'y' };
    expect(await newTeamCustomEmojiTrigger.run(triggerContext({ event }) as never)).toEqual([]);
  });
});

describe('thread replies are fetched across every page', () => {
  const parent = { ts: '1710304378.475129', text: 'parent' };

  function threeRepeatedParentPages() {
    repliesPages = {
      first: { messages: [parent, { ts: '1.1', text: 'a' }], response_metadata: { next_cursor: 'c2' } },
      c2: { messages: [parent, { ts: '1.2', text: 'b' }], response_metadata: { next_cursor: 'c3' } },
      c3: { messages: [{ ts: '1.3', text: 'c' }], response_metadata: { next_cursor: '' } },
    };
  }

  it.each([
    ['Retrieve Thread Messages', () => retrieveThreadMessages],
    ['Get Thread Replies (AI)', () => slackGetThreadRepliesAiAction],
  ])('%s follows cursors, dedupes the parent and blanks the cursor', async (_name, action) => {
    threeRepeatedParentPages();
    const result = await action().run(actionContext({ channel: 'C0123ABCD', threadTs: parent.ts }) as never);
    expect(repliesCalls.map((call) => call.cursor)).toEqual([undefined, 'c2', 'c3']);
    expect(repliesCalls.every((call) => call.limit === 200)).toBe(true);
    expect(result.messages?.map((message) => message.ts)).toEqual([parent.ts, '1.1', '1.2', '1.3']);
    expect(result.has_more).toBe(false);
    expect(result.response_metadata?.next_cursor).toBe('');
  });

  it('stops on a repeated cursor instead of looping forever', async () => {
    repliesPages = {
      first: { messages: [parent], response_metadata: { next_cursor: 'loop' } },
      loop: { messages: [{ ts: '2.1', text: 'a' }], response_metadata: { next_cursor: 'loop' } },
    };
    const result = await retrieveThreadMessages.run(actionContext({ channel: 'C0123ABCD', threadTs: parent.ts }) as never);
    expect(repliesCalls).toHaveLength(2);
    expect(result.messages?.map((message) => message.ts)).toEqual([parent.ts, '2.1']);
    expect(result.has_more).toBe(true);
    expect(result.response_metadata?.next_cursor).toBe('loop');
  });

  it('stops after 50 pages and hands back the cursor to continue from', async () => {
    const pages: typeof repliesPages = { first: { messages: [parent], response_metadata: { next_cursor: 'c1' } } };
    for (let index = 1; index <= 60; index += 1) {
      pages[`c${index}`] = { messages: [{ ts: `${index}.0`, text: `reply ${index}` }], response_metadata: { next_cursor: `c${index + 1}` } };
    }
    repliesPages = pages;
    const result = await retrieveThreadMessages.run(actionContext({ channel: 'C0123ABCD', threadTs: parent.ts }) as never);
    expect(repliesCalls).toHaveLength(50);
    expect(result.messages).toHaveLength(50);
    expect(result.has_more).toBe(true);
    expect(result.response_metadata?.next_cursor).toBe('c50');
  });

  it.each([
    ['Retrieve Thread Messages', () => retrieveThreadMessages],
    ['Get Thread Replies (AI)', () => slackGetThreadRepliesAiAction],
  ])('%s continues from a cursor handed back by a capped run', async (_name, action) => {
    repliesPages = {
      c50: { messages: [{ ts: '50.0', text: 'reply 50' }], response_metadata: { next_cursor: 'c51' } },
      c51: { messages: [{ ts: '51.0', text: 'reply 51' }], response_metadata: { next_cursor: '' } },
    };
    const result = await action().run(actionContext({ channel: 'C0123ABCD', threadTs: parent.ts, cursor: 'c50' }) as never);
    expect(repliesCalls.map((call) => call.cursor)).toEqual(['c50', 'c51']);
    expect(result.messages?.map((message) => message.ts)).toEqual(['50.0', '51.0']);
    expect(result.has_more).toBe(false);
  });

  it('accepts a message link as the thread timestamp', async () => {
    repliesPages = { first: { messages: [parent], response_metadata: { next_cursor: '' } } };
    await retrieveThreadMessages.run(actionContext({ channel: 'C0123ABCD', threadTs: 'https://acme.slack.com/archives/C0123ABCD/p1710304378475129' }) as never);
    expect(repliesCalls[0].ts).toBe(parent.ts);
  });
});

describe('New Mention in Channel refuses to enable with nothing to match', () => {
  it('throws when both users and user groups are empty', async () => {
    await expect(newMention.onEnable(triggerContext({ event: {}, propsValue: { users: [], usergroups: [] } }) as never)).rejects.toThrow(/at least one user or user group/);
  });

  it('does not fire when no configured user or group is mentioned', async () => {
    const event = { channel: 'C1', channel_type: 'channel', text: 'hello <@U999>' };
    const result = await newMention.run(triggerContext({ event, propsValue: { users: ['U123'], usergroups: [], channels: [], ignoreBots: false } }) as never);
    expect(result).toEqual([]);
  });

  it('fires and strips the mention when asked to', async () => {
    const event = { channel: 'C1', channel_type: 'channel', text: '<@U123> ship it' };
    const result = await newMention.run(triggerContext({ event, propsValue: { users: ['U123'], usergroups: [], channels: [], ignoreBots: false, removeMention: true } }) as never);
    expect(result).toHaveLength(1);
    expect((result[0] as { clean_text: string }).clean_text).toBe('ship it');
  });
});
