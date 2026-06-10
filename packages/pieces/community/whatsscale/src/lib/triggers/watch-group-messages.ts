import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../auth';
import { whatsscaleClient } from '../common/client';
import { whatsscaleProps } from '../common/props';

export const watchGroupMessagesTrigger = createTrigger({
  auth: whatsscaleAuth,
  name: 'watch_group_messages',
  displayName: 'Watch Group Messages',
  description: 'Triggers when a new message is received in any WhatsApp group.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    session: whatsscaleProps.session,
  },
  sampleData: {
    message_id: '3EB0A1B2C3D4E5F6G7H8I9',
    group_id: '120363423663126276@g.us',
    participant_id: '43001330020491@lid',
    participant_name: 'Jane Smith',
    body: 'Hey everyone, meeting at 3pm today!',
    has_media: false,
    media_type: 'text',
    media_url: '',
    media_mimetype: '',
    media_filename: '',
    timestamp: '2026-02-18T10:30:00.000Z',
    is_forwarded: false,
    quoted_message_id: '',
    quoted_body: '',
    is_reply: false,
    from_name: 'Jane Smith',
    chat_id: '120363423663126276@g.us',
    session_name: 'my_session',
  },
  async onEnable(context) {
    const auth = context.auth.secret_text;
    await whatsscaleClient(auth, HttpMethod.POST, '/make/hooks/subscribe', {
      session: context.propsValue.session,
      webhook_url: context.webhookUrl,
      platform: 'activepieces',
      trigger_type: 'group',
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
