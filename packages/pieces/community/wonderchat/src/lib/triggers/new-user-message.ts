import {
  PiecePropValueSchema,
  createTrigger,
  TriggerStrategy,
  Property
} from '@activepieces/pieces-framework';
import {
  Polling,
  pollingHelper,
  DedupeStrategy,
  httpClient,
  HttpMethod
} from '@activepieces/pieces-common';
import { wonderchatAuth } from '../..';

interface Message {
  content: string;
  type: 'user' | 'bot';
  createdAt: string;
}

const polling: Polling<
  PiecePropValueSchema<typeof wonderchatAuth>,
  { chatlogId: string }
> = {
  strategy: DedupeStrategy.TIMEBASED,
  items: async ({ auth, propsValue, lastFetchEpochMS }) => {
    const response = await httpClient.sendRequest<{ messages: Message[] }>({
      method: HttpMethod.POST,
      url: 'https://app.wonderchat.io/api/v1/messages',
      headers: { 'Content-Type': 'application/json' },
      body: {
        apiKey: auth,
        chatlogId: propsValue.chatlogId
      }
    });
    const messages = response.body.messages;

    const newMessages = messages
      .filter((message) => message.type === 'user')
      .filter(
        (message) => new Date(message.createdAt).getTime() > lastFetchEpochMS
      );

    return newMessages.map((message) => ({
      epochMilliSeconds: new Date(message.createdAt).getTime(),
      data: message
    }));
  }
};

export const newUserMessage = createTrigger({
  auth: wonderchatAuth,
  name: 'newUserMessage',
  displayName: 'New User Message',
  description:
    'Triggers when a new message is sent by a user in a specific chatlog.',
  props: {
    chatlogId: Property.ShortText({
      displayName: 'Chatlog ID',
      description:
        'The ID of your chat session (can be found under Chatlog Details section, labeled as "ID")',
      required: true,
    }),
  },
  sampleData: {
    content: 'I would want to now more about the products pricing strategy',
    type: 'user',
    createdAt: '2023-12-01T06:35:15.456Z'
  },
  type: TriggerStrategy.POLLING,

  async test(context) {
    return await pollingHelper.poll(polling, context);
  },

  async onEnable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async onDisable(context) {
    const { store, auth, propsValue } = context;
    await pollingHelper.onEnable(polling, { store, auth, propsValue });
  },

  async run(context) {
    return await pollingHelper.poll(polling, context);
  }
});
