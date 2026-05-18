import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const discordSendMessageWebhook = createAction({
  name: 'send_message_webhook',
  description: 'Send a discord message via webhook',
  displayName: 'Send Message Webhook',
  requireAuth: false,
  props: {
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Name',
      required: false,
    }),
    content: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
    avatar_url: Property.ShortText({
      displayName: 'Avatar URL',
      description: 'The avatar url for webhook',
      required: false,
    }),
    embeds: Property.Json({
      displayName: 'embeds',
      description: 'Embeds to send along with the message',
      required: false,
      defaultValue: [],
    }),
    tts: Property.Checkbox({
      displayName: 'Text to speech',
      description: 'Robot reads the message',
      required: false,
    }),
  },
  async run(configValue) {
    const request: HttpRequest<{
      content: string;
      username: string | undefined;
      avatar_url: string | undefined;
      tts: boolean | undefined;
      embeds: Record<string, unknown> | undefined;
    }> = {
      method: HttpMethod.POST,
      url: configValue.propsValue['webhook_url'],
      body: {
        username: configValue.propsValue['username'],
        content: configValue.propsValue['content'],
        avatar_url: configValue.propsValue['avatar_url'],
        tts: configValue.propsValue['tts'],
        embeds: configValue.propsValue['embeds'],
      },
    };
    return await httpClient.sendRequest<never>(request);
  },
});
