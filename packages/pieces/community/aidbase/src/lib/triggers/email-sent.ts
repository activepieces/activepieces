import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { emailInboxDropdown } from '../common/props';

export const emailSent = createTrigger({
  auth: aidbaseAuth,
  name: 'email_sent',
  displayName: 'Email Sent',
  description: 'Fires when an email is sent from Aidbase.',

  props: {
    inbox_id: emailInboxDropdown,
  },

  sampleData: {
    id: 'evt_1Hc2a8f36qsa23e',
    webhook_id: 'c1042e89-fea5-415c-8bd2-e557abf25307',
    object: 'webhook_event',
    created: '2023-10-31T17:36:56.491Z',
    type: 'email.sent',
    changes: {
      message: {
        id: '00bcde85-2b4d-4682-ac8b-b280dc819559',
        type: 'AGENT',
        created: '2023-10-31T17:39:56.491Z',
        message: 'Hi John, than you for your message...',
        session_data: {
          id: '2b06ada3f5bb',
          username: 'jamesdoe',
          email: 'james@doe.com',
        },
      },
    },
    data: {
      id: '7c3c5609-b838-4643-8e8c-2a2da0a14c4a',
      email_inbox_id: '286d123e-5961-457c-8fd5-56f192ec315d',
      status: 'OPEN',
    },
  },

  type: TriggerStrategy.WEBHOOK,

  // onEnable is not needed due to manual webhook setup in the Aidbase Dashboard.
  async onEnable(context) {
    return;
  },

  // onDisable is not needed as Activepieces does not manage the webhook lifecycle.
  async onDisable(context) {
    return;
  },

  async run(context) {
    const payloadBody = context.payload.body as {
      type: string;
      data: { email_inbox_id: string };
    };
    const { inbox_id } = context.propsValue;

    if (payloadBody.type !== 'email.sent') {
      return [];
    }

    if (inbox_id && payloadBody.data.email_inbox_id !== inbox_id) {
      return [];
    }

    return [payloadBody];
  },
});
