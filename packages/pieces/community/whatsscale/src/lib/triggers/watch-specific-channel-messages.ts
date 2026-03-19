import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../auth';
import { whatsscaleClient } from '../common/client';
import { whatsscaleProps } from '../common/props';

export const watchSpecificChannelMessagesTrigger = createTrigger({
  auth: whatsscaleAuth,
  name: 'watch_specific_channel_messages',
  displayName: 'Watch Specific Channel Messages',
  description: 'Triggers when a new message is posted to a specific WhatsApp Channel.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    session: whatsscaleProps.session,
    channel: whatsscaleProps.channel,
  },
  sampleData: {
    message_id: 'false_123123@newsletter_1111111111111111111111',
    channel_id: '120363401850139775@newsletter',
    body: 'New product launch announcement!',
    has_media: false,
    media_type: 'text',
    media_url: '',
    media_mimetype: '',
    media_filename: '',
    timestamp: '2026-02-18T10:30:00.000Z',
    session_name: 'my_session',
  },
  async onEnable(context) {
    const auth = context.auth.secret_text;
    await whatsscaleClient(auth, HttpMethod.POST, '/make/hooks/subscribe', {
      session: context.propsValue.session,
      webhook_url: context.webhookUrl,
      platform: 'activepieces',
      trigger_type: 'channel',
      filter_id: context.propsValue.channel, // includes @newsletter — send as-is
    });
  },
  async onDisable(context) {
    const auth = context.auth.secret_text;
    await whatsscaleClient(auth, HttpMethod.POST, '/make/hooks/unsubscribe', {
      webhook_url: context.webhookUrl,
    });
  },
  async run(context) {
    return [context.payload.body];
  },
});
