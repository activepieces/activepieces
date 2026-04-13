import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../auth';
import { whatsscaleClient } from '../common/client';
import { whatsscaleProps } from '../common/props';

export const watchChannelMessagesTrigger = createTrigger({
  auth: whatsscaleAuth,
  name: 'watch_channel_messages',
  displayName: 'Watch Channel Messages',
  description:
    'Triggers when a new message is posted to any WhatsApp Channel (includes own posts).',
  type: TriggerStrategy.WEBHOOK,
  props: {
    session: whatsscaleProps.session,
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
