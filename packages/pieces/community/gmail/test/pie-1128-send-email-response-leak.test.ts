import { beforeEach, describe, expect, it, vi } from 'vitest';

const draftsCreate = vi.fn();
const messagesSend = vi.fn();

vi.mock('@googleapis/gmail', () => ({
  gmail: () => ({
    users: {
      drafts: { create: draftsCreate },
      messages: { send: messagesSend, list: vi.fn() },
    },
  }),
}));

vi.mock('../src/lib/auth', () => ({
  gmailAuth: {},
  createGoogleClient: vi.fn().mockResolvedValue({}),
  getUserEmail: vi.fn().mockResolvedValue('me@example.com'),
}));

import { gmailSendEmailAction } from '../src/lib/actions/send-email-action';
import { gmailAiSendEmailAction } from '../src/lib/actions/ai-send-email-action';

const PROXY = 'http://user:secret@proxy:8080';
const TOKEN = 'Bearer tok';

function gaxiosLike({ data }: { data: Record<string, unknown> }) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: { authorization: TOKEN },
    config: {
      agent: { proxy: new URL(PROXY) },
      url: PROXY,
      headers: { Authorization: TOKEN },
    },
    request: { responseURL: 'https://gmail.googleapis.com/x' },
  };
}

function runAction({
  action,
  draft,
}: {
  action: { run: unknown };
  draft: boolean;
}): Promise<unknown> {
  const context = {
    auth: {},
    propsValue: {
      receiver: ['to@example.com'],
      subject: 'Hello',
      body: 'hi',
      body_type: 'plain_text',
      draft,
    },
  };
  const runFn = action.run;
  if (typeof runFn !== 'function') {
    throw new Error('action has no run');
  }
  return Promise.resolve(Reflect.apply(runFn, action, [context]));
}

function field({ from, key }: { from: unknown; key: string }): unknown {
  return typeof from === 'object' && from !== null
    ? Reflect.get(from, key)
    : undefined;
}

beforeEach(() => {
  draftsCreate.mockReset().mockResolvedValue(
    gaxiosLike({
      data: {
        id: 'd1',
        message: { id: 'm1', threadId: 't1', labelIds: ['DRAFT'] },
      },
    })
  );
  messagesSend
    .mockReset()
    .mockResolvedValue(
      gaxiosLike({ data: { id: 'm2', threadId: 't2', labelIds: ['SENT'] } })
    );
});

describe.each([
  { name: 'Send Email', action: gmailSendEmailAction },
  { name: 'AI Send Email', action: gmailAiSendEmailAction },
])('$name output', ({ action }) => {
  it('returns only data, status and statusText when sending', async () => {
    const output = await runAction({ action, draft: false });
    expect(Object.keys(Object(output)).sort()).toEqual([
      'data',
      'status',
      'statusText',
    ]);
    expect(output).toEqual({
      data: { id: 'm2', threadId: 't2', labelIds: ['SENT'] },
      status: 200,
      statusText: 'OK',
    });
    const serialized = JSON.stringify(output);
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('Bearer');
  });

  it('returns only data, status and statusText when saving a draft', async () => {
    const output = await runAction({ action, draft: true });
    expect(Object.keys(Object(output)).sort()).toEqual([
      'data',
      'status',
      'statusText',
    ]);
    expect(field({ from: output, key: 'data' })).toEqual({
      id: 'd1',
      message: { id: 'm1', threadId: 't1', labelIds: ['DRAFT'] },
    });
    const serialized = JSON.stringify(output);
    expect(serialized).not.toContain('secret');
    expect(serialized).not.toContain('Bearer');
  });
});
