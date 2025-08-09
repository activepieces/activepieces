import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { googleChatAuth } from '../common/auth';
import { GoogleChatWebhookPayload } from '../common/types';
import { getSpacesOptions } from '../common/utils';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const newMessageTrigger = createTrigger({
  auth: googleChatAuth,
  name: 'new_message',
  displayName: 'New Message',
  description: 'Fires when a new message is received in Google Chat',
  props: {
    space: Property.Dropdown({
      displayName: 'Space',
      description: 'The space to monitor for new messages',
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

        return getSpacesOptions(auth as OAuth2PropertyValue);
      },
    }),
    ignoreBotMessages: Property.Checkbox({
      displayName: 'Ignore Bot Messages',
      description: 'Ignore messages sent by bots',
      required: false,
      defaultValue: true,
    }),
  },
  type: TriggerStrategy.APP_WEBHOOK,
  sampleData: {
    name: 'spaces/space-id/messages/message-id',
    sender: {
      name: 'users/user-id',
      displayName: 'User Name',
      type: 'HUMAN',
    },
    createTime: '2023-01-01T00:00:00.000Z',
    text: 'Hello, world!',
    thread: {
      name: 'spaces/space-id/threads/thread-id',
    },
  },
  onEnable: async (context) => {
    // Set up webhook for the specified space
    const space = context.propsValue.space;
    context.app.createListeners({
      events: ['message'],
      identifierValue: space,
    });
  },
  onDisable: async () => {
    // Clean up webhook
  },
  run: async (context) => {
    const payloadBody = context.payload.body as GoogleChatWebhookPayload;
    const { ignoreBotMessages } = context.propsValue;

    // Check if it's a new message event
    if (payloadBody.type !== 'MESSAGE') {
      return [];
    }

    // Check for bot messages if ignoreBotMessages is enabled
    if (ignoreBotMessages && payloadBody.message?.sender?.type === 'BOT') {
      return [];
    }

    return [payloadBody.message];
  },
}); 