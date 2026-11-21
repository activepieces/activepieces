import { Property, createAction, tryCatch } from '@activepieces/pieces-framework';
import { retuneAuth } from '../auth';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

export const askChatbot = createAction({
  auth: retuneAuth,
  name: 'ask_chatbot',
  classification: 'WRITE',
  displayName: 'Ask Chatbot',
  description: 'Send a message to a chatbot thread and get the bot\'s reply.',
  audience: 'both',
  aiMetadata: { description: 'Sends a user message to an existing re:tune chatbot conversation thread and returns the bot\'s generated reply. Use this to interact with a configured re:tune chatbot; requires both a thread ID (a conversation context that must already exist) and the message text. Not idempotent — each call appends a turn to the thread and produces a fresh AI response.', idempotent: false },
  propertyGroups: [
    { key: 'destination', display: 'section', label: 'Send to', icon: 'send', props: ['thread'] },
    { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['message'] },
  ],
  props: {
    thread: Property.Dropdown({
      auth: retuneAuth,
      displayName: 'Thread',
      description: 'The conversation in your chatbot to post the message to.',
      required: true,
      refreshers: [],
      options: async ({ auth }) => {
        if (!auth) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Please connect your account first',
          };
        }
        const { data, error } = await tryCatch(() =>
          httpClient.sendRequest<{ threads: { id: string; name?: string }[] }>({
            url: `https://retune.so/api/chat/${auth.props.chatId}/threads`,
            method: HttpMethod.POST,
            headers: {
              'X-Workspace-API-Key': auth.props.apiKey,
            },
            body: {},
          }),
        );

        if (error) {
          return {
            disabled: true,
            options: [],
            placeholder: 'Failed to load threads. Check your connection.',
          };
        }

        if (data.body.threads.length === 0) {
          return {
            disabled: false,
            options: [],
            placeholder: 'No threads found. Create one in re:tune first.',
          };
        }

        return {
          options: data.body.threads.map((item) => ({
            label: item.name ?? item.id,
            value: item.id,
          })),
        };
      },
    }),
    message: Property.ShortText({
      displayName: 'Message',
      description: 'What to ask the chatbot.',
      placeholder: 'What are your opening hours?',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { thread, message } = propsValue;

    const response = await httpClient.sendRequest<{ response: { value: string } }>({
      url: `https://retune.so/api/chat/${auth.props.chatId}/response`,
      method: HttpMethod.POST,
      headers: {
        'X-Workspace-API-Key': auth.props.apiKey,
      },
      body: {
        threadId: thread,
        input: message,
      },
    });

    return response.body.response.value;
  },
});
