import { MarkdownVariant, Property, createAction } from '@activepieces/pieces-framework';
import { lineAuth2 } from '../..';
import {
  AuthenticationType,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const pushMessage = createAction({
  name: 'push_message', // Must be a unique across the piece, this shouldn't be changed.
  classification: 'WRITE',
  auth: lineAuth2,
  displayName: 'Send Message',
  description: 'Send a text message to a LINE user or group chat.',
  audience: 'both',
  aiMetadata: {
    description: 'Sends a text message from the LINE bot directly to a single recipient identified by their LINE user ID. Use this to proactively message a user (not as a reply within a webhook session); the user ID is typically captured from an incoming message webhook payload. Not idempotent — each call delivers a new message.',
    idempotent: false,
  },
  props: {
    userId: Property.ShortText({
      displayName: 'Recipient ID',
      description: 'User, group or room ID. Map it from Source in the New Message trigger.',
      placeholder: 'U4af4980629...',
      required: true,
    }),
    text: Property.ShortText({
      displayName: 'Text',
      description: 'Plain text, up to 5,000 characters.',
      placeholder: 'Thanks for your message! We\'ll reply soon.',
      required: true,
    }),
    quotaNote: Property.MarkDown({
      value: 'Each person who gets the message, including every group member, counts toward your LINE plan\'s monthly message limit.',
      variant: MarkdownVariant.INFO,
    }),
  },
  propertyGroups: [
    { key: 'destination', display: 'section', label: 'Send to', icon: 'send', props: ['userId', 'quotaNote'] },
    { key: 'message', display: 'section', label: 'Message', icon: 'text', props: ['text'] },
  ],
  async run(context) {
    return httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `https://api.line.me/v2/bot/message/push`,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: context.auth.secret_text,
      },
      body: {
        to: context.propsValue.userId,
        messages: [
          {
            type: 'text',
            text: context.propsValue.text,
          },
        ],
      },
    });
  },
});
