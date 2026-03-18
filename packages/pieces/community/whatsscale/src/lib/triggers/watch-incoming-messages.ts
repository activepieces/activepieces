import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { whatsscaleAuth } from '../auth';
import { whatsscaleClient } from '../common/client';
import { whatsscaleProps } from '../common/props';

export const watchIncomingMessagesTrigger = createTrigger({
  auth: whatsscaleAuth,
  name: 'watch_incoming_messages',
  displayName: 'Watch Incoming Messages',
  description: 'Triggers when a new 1-on-1 WhatsApp message is received.',
  type: TriggerStrategy.WEBHOOK,
  props: {
    session: whatsscaleProps.session,
  },
  sampleData: {
    message_id: '3EB0A1B2C3D4E5F6G7H8I9',
    chat_id: '31612345678',
    from_number: '31612345678',
    from_name: 'John Doe',
    body: 'Hello, I have a question about your product',
    has_media: false,
    media_type: 'text',
    media_url: '',
    media_mimetype: '',
    media_filename: '',
    timestamp: '2026-02-04T10:30:00.000Z',
    is_forwarded: false,
    quoted_message_id: '',
    quoted_body: '',
    is_reply: false,
    session_name: 'my_session',
  },
  async onEnable(context) {
    const auth = context.auth.secret_text;
    await whatsscaleClient(auth, HttpMethod.POST, '/make/hooks/subscribe', {
      session: context.propsValue.session,
      webhook_url: context.webhookUrl,
      platform: 'activepieces',
      // No trigger_type — proxy defaults to '1on1' when absent
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
