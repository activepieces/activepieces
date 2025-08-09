import { Property, TriggerStrategy, createTrigger } from '@activepieces/pieces-framework';
import { googleChatAuth } from '../common/auth';
import { GoogleChatWebhookPayload, GoogleChatAnnotation } from '../common/types';
import { getSpacesOptions } from '../common/utils';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const newMentionTrigger = createTrigger({
  auth: googleChatAuth,
  name: 'new_mention',
  displayName: 'New Mention',
  description: 'Fires when a new mention is received in a space',
  props: {
    space: Property.Dropdown({
      displayName: 'Space',
      description: 'The space to monitor for mentions',
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
    mentionType: Property.StaticDropdown({
      displayName: 'Mention Type',
      description: 'Type of mentions to monitor',
      required: true,
      options: {
        options: [
          { label: 'All Mentions', value: 'ALL' },
          { label: 'Direct Mentions Only', value: 'DIRECT' },
          { label: 'Bot Mentions Only', value: 'BOT' },
        ],
      },
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
    text: '@bot Hello!',
    annotations: [
      {
        type: 'USER_MENTION',
        startIndex: 0,
        length: 4,
        userMention: {
          user: {
            name: 'users/user-id',
            displayName: 'Bot Name',
            type: 'BOT',
          },
        },
      },
    ],
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
    const { mentionType } = context.propsValue;

    // Check if it's a new message event
    if (payloadBody.type !== 'MESSAGE') {
      return [];
    }

    // Check if the message contains mentions
    const message = payloadBody.message;
    if (!message?.annotations || message.annotations.length === 0) {
      return [];
    }

    // Filter mentions based on type
    const mentions = message.annotations.filter((annotation: GoogleChatAnnotation) => {
      if (mentionType === 'ALL') {
        return annotation.type === 'USER_MENTION';
      } else if (mentionType === 'DIRECT') {
        return annotation.type === 'USER_MENTION' && annotation.userMention?.user?.type === 'HUMAN';
      } else if (mentionType === 'BOT') {
        return annotation.type === 'USER_MENTION' && annotation.userMention?.user?.type === 'BOT';
      }
      return false;
    });

    if (mentions.length === 0) {
      return [];
    }

    return [message];
  },
}); 