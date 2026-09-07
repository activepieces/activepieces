/// <reference types="vitest/globals" />

import { createMockPollingTriggerContext } from '@activepieces/pieces-framework';

const historyListMock = vi.fn();
const getProfileMock = vi.fn();
const getMessageMock = vi.fn();
const getThreadMock = vi.fn();
const listMessagesMock = vi.fn();

vi.mock('@googleapis/gmail', () => ({
  gmail: () => ({
    users: {
      getProfile: getProfileMock,
      history: {
        list: historyListMock,
      },
      messages: {
        get: getMessageMock,
        list: listMessagesMock,
      },
      threads: {
        get: getThreadMock,
      },
    },
  }),
}));

vi.mock('../src/lib/auth', () => ({
  gmailAuth: {},
  createGoogleClient: vi.fn().mockResolvedValue({}),
}));

vi.mock('../src/lib/common/data', () => ({
  parseStream: vi.fn().mockResolvedValue({
    subject: 'Hello',
    text: 'Hi',
    attachments: [],
  }),
  convertAttachment: vi.fn().mockResolvedValue([]),
}));

import { gmailNewStarredEmailTrigger } from '../src/lib/triggers/new-starred-email';
import { gmailNewConversationTrigger } from '../src/lib/triggers/new-conversation';

function memoryStore(initial: Record<string, unknown> = {}) {
  const values = new Map<string, unknown>(Object.entries(initial));
  return {
    put: async <T>(key: string, value: T) => {
      values.set(key, value);
      return value;
    },
    get: async (key: string) => values.get(key) ?? null,
    delete: async (key: string) => {
      values.delete(key);
    },
    values,
  };
}

describe('gmail MCP triggers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('pages starred history and keeps going when one message 404s', async () => {
    const store = memoryStore({ lastHistoryId: '10' });
    historyListMock
      .mockResolvedValueOnce({
        data: {
          history: [
            {
              id: '11',
              labelsAdded: [
                { labelIds: ['STARRED'], message: { id: 'gone' } },
                { labelIds: ['STARRED'], message: { id: 'kept' } },
              ],
            },
          ],
          nextPageToken: 'p2',
          historyId: '11',
        },
      })
      .mockResolvedValueOnce({
        data: {
          history: [],
          historyId: '12',
        },
      });
    getMessageMock.mockImplementation(async ({ id }: { id: string }) => {
      if (id === 'gone') {
        throw { code: 404 };
      }
      return {
        data: {
          id,
          threadId: 't-kept',
          raw: 'raw',
          internalDate: String(Date.now()),
        },
      };
    });
    getThreadMock.mockResolvedValue({
      data: { id: 't-kept', messages: [] },
    });

    const context = {
      ...createMockPollingTriggerContext({ propsValue: {} }),
      store,
    };

    const events = await gmailNewStarredEmailTrigger.run(context);

    expect(historyListMock).toHaveBeenCalledTimes(2);
    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: 'kept:11',
      data: { starInfo: { messageId: 'kept' } },
    });
    expect(store.values.get('lastHistoryId')).toBe('12');
  });

  it('resets an expired starred history checkpoint', async () => {
    const store = memoryStore({ lastHistoryId: 'stale' });
    historyListMock.mockRejectedValue({ code: 404 });
    getProfileMock.mockResolvedValue({ data: { historyId: 'fresh' } });

    const events = await gmailNewStarredEmailTrigger.run({
      ...createMockPollingTriggerContext({ propsValue: {} }),
      store,
    });

    expect(events).toEqual([]);
    expect(store.values.get('lastHistoryId')).toBe('fresh');
  });

  it('still emits a new conversation after a quick reply arrives', async () => {
    const store = memoryStore({
      lastHistoryId: '10',
      processedThreads: [],
    });
    const firstMessageTime = Date.now() - 5_000;
    historyListMock.mockResolvedValue({
      data: {
        history: [
          {
            id: '11',
            messagesAdded: [
              { message: { id: 'm1', threadId: 'thread-1' } },
              { message: { id: 'm2', threadId: 'thread-1' } },
            ],
          },
        ],
        historyId: '11',
      },
    });
    getThreadMock.mockResolvedValue({
      data: {
        id: 'thread-1',
        snippet: 'Hello',
        messages: [
          {
            id: 'm1',
            internalDate: String(firstMessageTime),
            payload: {
              headers: [
                { name: 'From', value: 'ada@example.com' },
                { name: 'To', value: 'me@example.com' },
                { name: 'Subject', value: 'Hello' },
                { name: 'Date', value: 'Mon, 7 Sep 2026 00:00:00 +0000' },
              ],
            },
          },
          {
            id: 'm2',
            internalDate: String(Date.now()),
          },
        ],
      },
    });
    getMessageMock.mockResolvedValue({
      data: { id: 'm1', raw: 'raw' },
    });

    const events = await gmailNewConversationTrigger.run({
      ...createMockPollingTriggerContext({
        propsValue: { maxAgeHours: 24 },
      }),
      store,
    });

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: 'conversation_thread-1',
      data: {
        thread: { id: 'thread-1', messageCount: 2 },
        conversation: { starter: { from: 'ada@example.com' } },
      },
    });
  });
});
