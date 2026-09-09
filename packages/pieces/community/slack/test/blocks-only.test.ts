import { AppConnectionType } from '@activepieces/pieces-framework';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const sent: Record<string, unknown>[] = [];

vi.mock('@slack/web-api', () => ({
  WebClient: class {
    chat = {
      postMessage: async (args: Record<string, unknown>) => {
        sent.push(args);
        return { ok: true };
      },
      update: async (args: Record<string, unknown>) => {
        sent.push(args);
        return { ok: true };
      },
    };
    conversations = {
      open: async () => ({ ok: true, channel: { id: 'D0123ABCD' } }),
    };
    files = {
      uploadV2: async (args: Record<string, unknown>) => {
        sent.push(args);
        return { ok: true };
      },
    };
  },
}));

const { updateMessage } = await import('../src/lib/actions/update-message');
const { slackUpdateMessageAiAction } = await import(
  '../src/lib/actions/update-message.action'
);
const { slackSendDirectMessageAction } = await import(
  '../src/lib/actions/send-direct-message-action'
);
const { slackSendDirectMessageAiAction } = await import(
  '../src/lib/actions/send-direct-message.action'
);

const CONTEXT_BLOCK = {
  type: 'context',
  elements: [{ type: 'mrkdwn', text: 'build 42 passed' }],
};

const auth = {
  type: AppConnectionType.CUSTOM_AUTH,
  props: { botToken: 'xoxb-test' },
};

function ctx(propsValue: Record<string, unknown>) {
  return {
    auth,
    propsValue,
    server: { publicUrl: 'https://cloud.activepieces.com/api/' },
    project: { id: 'proj_1' },
    flows: { current: { id: 'flow_1' } },
  };
}

const lastCall = () => sent[sent.length - 1];

beforeEach(() => {
  sent.length = 0;
});

const updateBase = { channel: 'C0123ABCD', ts: '1710304378.475129' };

describe.each([
  {
    name: 'Update message (updateMessage)',
    run: (props: Record<string, unknown>) =>
      updateMessage.run(ctx({ ...updateBase, ...props })),
    guard: /Either Message or Block Kit blocks must be provided/,
  },
  {
    name: 'Update Message AI (slack_update_message)',
    run: (props: Record<string, unknown>) =>
      slackUpdateMessageAiAction.run(ctx({ ...updateBase, ...props })),
    guard: /Either Message or Block Kit blocks must be provided/,
  },
  {
    name: 'Send Message To A User (send_direct_message)',
    run: (props: Record<string, unknown>) =>
      slackSendDirectMessageAction.run(ctx({ userId: 'U0123ABCD', ...props })),
    guard: /Either Message or Block Kit blocks must be provided/,
  },
  {
    name: 'Send Direct Message AI (slack_send_direct_message)',
    run: (props: Record<string, unknown>) =>
      slackSendDirectMessageAiAction.run(ctx({ userId: 'U0123ABCD', ...props })),
    guard: /Either Message or Block Kit blocks must be provided/,
  },
])('$name', ({ run, guard }) => {
  it('sends blocks only, with no section pushed above them', async () => {
    await run({ blocks: [CONTEXT_BLOCK] });

    expect(lastCall().blocks).toEqual([CONTEXT_BLOCK]);
    expect(lastCall().text).toBeUndefined();
  });

  it('treats an empty Message the same as an absent one', async () => {
    await run({ text: '', blocks: [CONTEXT_BLOCK] });

    expect(lastCall().blocks).toEqual([CONTEXT_BLOCK]);
    expect(lastCall().text).toBeUndefined();
  });

  it('still renders Message as a section above the blocks when provided', async () => {
    await run({ text: 'deploy finished', blocks: [CONTEXT_BLOCK] });

    expect(lastCall().blocks).toEqual([
      { type: 'section', text: { type: 'mrkdwn', text: 'deploy finished' } },
      CONTEXT_BLOCK,
    ]);
    expect(lastCall().text).toBe('deploy finished');
  });

  it('sends Message alone as a section when no blocks are given', async () => {
    await run({ text: 'deploy finished' });

    expect(lastCall().blocks).toEqual([
      { type: 'section', text: { type: 'mrkdwn', text: 'deploy finished' } },
    ]);
    expect(lastCall().text).toBe('deploy finished');
  });

  it('rejects when neither Message nor blocks are provided', async () => {
    await expect(run({})).rejects.toThrow(guard);
    expect(sent).toHaveLength(0);
  });

  it('rejects when Message is empty and blocks is an empty array', async () => {
    await expect(run({ text: '', blocks: [] })).rejects.toThrow(guard);
    expect(sent).toHaveLength(0);
  });
});

describe('mentionOriginFlow footer', () => {
  it('appends the footer below a blocks-only update', async () => {
    await updateMessage.run(
      ctx({ ...updateBase, blocks: [CONTEXT_BLOCK], mentionOriginFlow: true })
    );

    const blocks = lastCall().blocks as { type: string }[];
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual(CONTEXT_BLOCK);
    expect(blocks[1].type).toBe('context');
  });

  it('cannot satisfy the content requirement on its own', async () => {
    await expect(
      updateMessage.run(ctx({ ...updateBase, mentionOriginFlow: true }))
    ).rejects.toThrow(/Either Message or Block Kit blocks must be provided/);
    expect(sent).toHaveLength(0);
  });

  it('appends the footer below a blocks-only DM', async () => {
    await slackSendDirectMessageAction.run(
      ctx({ userId: 'U0123ABCD', blocks: [CONTEXT_BLOCK], mentionOriginFlow: true })
    );

    const blocks = lastCall().blocks as { type: string }[];
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual(CONTEXT_BLOCK);
    expect(blocks[1].type).toBe('context');
  });

  it('cannot satisfy the content requirement on its own for a DM', async () => {
    await expect(
      slackSendDirectMessageAction.run(
        ctx({ userId: 'U0123ABCD', mentionOriginFlow: true })
      )
    ).rejects.toThrow(/Either Message or Block Kit blocks must be provided/);
    expect(sent).toHaveLength(0);
  });
});
