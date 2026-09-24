import { createAction, Property } from '@activepieces/pieces-framework';
import {
  HttpRequest,
  HttpMethod,
  httpClient,
} from '@activepieces/pieces-common';

export const discordSendMessageWebhook = createAction({
  name: 'send_message_webhook',
  classification: 'WRITE',
  description: 'Post a message to a channel through a Discord webhook URL.',
  audience: 'both',
  aiMetadata: { description: 'Posts a message to a Discord channel through an incoming webhook URL, with optional custom username, avatar, and rich embeds. Use when you have a webhook URL rather than a bot connection; no Discord auth is needed. Each call posts a new message, so it is not idempotent.', idempotent: false },
  displayName: 'Send Message via Webhook',
  requireAuth: false,
  props: {
    webhook_url: Property.ShortText({
      displayName: 'Webhook URL',
      description: 'Server Settings, Integrations, Webhooks, then Copy Webhook URL.',
      placeholder: 'https://discord.com/api/webhooks/…',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Message',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Display Name',
      description: 'Shown instead of the webhook name for this message.',
      placeholder: 'Deploy Bot',
      required: false,
      advanced: true,
    }),
    avatar_url: Property.ShortText({
      displayName: 'Avatar URL',
      description: 'Shown instead of the webhook avatar for this message.',
      placeholder: 'https://example.com/avatar.png',
      required: false,
      advanced: true,
    }),
    embeds: Property.Json({
      displayName: 'Embeds',
      description: 'JSON array of Discord embed objects.',
      required: false,
      advanced: true,
      defaultValue: [],
    }),
    tts: Property.Checkbox({
      displayName: 'Text to Speech',
      description: 'Discord reads the message aloud in the channel.',
      required: false,
      advanced: true,
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
