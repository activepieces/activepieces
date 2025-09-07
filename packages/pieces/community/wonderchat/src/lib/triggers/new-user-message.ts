import {
  createTrigger,
  Property,
  TriggerStrategy,
  PiecePropValueSchema,
} from '@activepieces/pieces-framework';
import {
  DedupeStrategy,
  Polling,
  pollingHelper,
} from '@activepieces/pieces-common';
import dayjs from 'dayjs';
import { HttpMethod } from '@activepieces/pieces-common';
import { wcRequest } from '../client';
import { wonderchatAuth } from '../auth';

type ChatMessage = {
  id: string;
  botId: string;
  conversationId: string;
  role: 'user' | 'assistant' | string;
  content: string;
  createdAt: string; // ISO 8601
};

type Props = {
  botId: string;
};

const polling: Polling<
  PiecePropValueSchema<typeof wonderchatAuth>,
  Props
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    // Add type guard for auth
    if (typeof auth !== 'string') {
      throw new Error('Authentication token is required and must be a string');
    }

    const apiKey = auth;
    const { botId } = propsValue;
    const afterEpoch = lastFetchEpochMS ?? 0;

    // Optional: if the API supports server-side filtering, use query params instead of client-side filters.
    const page: { data: ChatMessage[]; nextCursor?: string } = await wcRequest<{
      data: ChatMessage[];
      nextCursor?: string;
    }>({
      apiKey,
      method: HttpMethod.GET,
      url: `/api/v1/bots/${botId}/messages`, // TODO: confirm path in Wonderchat docs
      // query: { role: 'user', after: new Date(afterEpoch).toISOString(), limit: 50 },
    });

    const messages = Array.isArray(page?.data)
      ? page.data
      : ([] as ChatMessage[]);

    const filtered = messages.filter(
      (m) => m.role === 'user' && dayjs(m.createdAt).valueOf() > afterEpoch
    );

    return filtered.map((m) => ({
      epochMilliSeconds: dayjs(m.createdAt).valueOf(),
      data: m,
    }));
  },
};

export const newUserMessage = createTrigger({
  // auth is defined at the piece level (see createPiece in src/index.ts)
  name: 'newUserMessage',
  displayName: 'New User Message',
  description: 'Triggers when a user sends a message to the chatbot.',
  props: {
    botId: Property.ShortText({
      displayName: 'Bot ID',
      required: true,
    }),
  },
  sampleData: {
    id: 'msg_123',
    botId: 'bot_abc',
    conversationId: 'conv_456',
    role: 'user',
    content: 'Hello!',
    createdAt: '2024-01-01T12:00:00Z',
  },
  type: TriggerStrategy.POLLING,
  async test(context) {
    return await pollingHelper.test(polling, {
      ...context,
      auth: context.auth as string,
    });
  },
  async onEnable(context) {
    return await pollingHelper.onEnable(polling, {
      store: context.store,
      auth: context.auth as string,
      propsValue: context.propsValue,
    });
  },
  async onDisable(context) {
    return await pollingHelper.onDisable(polling, {
      store: context.store,
      auth: context.auth as string,
      propsValue: context.propsValue,
    });
  },
  async run(context) {
    return await pollingHelper.poll(polling, {
      ...context,
      auth: context.auth as string,
    });
  },
});