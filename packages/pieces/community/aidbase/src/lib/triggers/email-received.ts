import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { emailInboxDropdown } from '../common/props';

export const emailReceived = createTrigger({
  auth: aidbaseAuth,
  name: 'email_received',
  displayName: 'Email Received',
  description: 'Fires when a new email is received in an Aidbase inbox.',

  props: {
    inbox_id: emailInboxDropdown,
  },

  sampleData: {
    id: 'evt_1Hc2a8f36qsa23e',
    type: 'email.received',
    data: {
      id: '7c3c5609-b838-4643-8e8c-2a2da0a14c4a',
      email_inbox_id: '286d123e-5961-457c-8fd5-56f192ec315d',
      topic: 'Question about something',
      session_data: {
        username: 'John Doe',
        email: 'john@doe.com',
      },
    },
  },

  type: TriggerStrategy.WEBHOOK,

  // onEnable is not needed because the user manually creates the webhook in the Aidbase UI.
  async onEnable(context) {
    return;
  },

  // onDisable is not needed because the webhook is managed outside of Activepieces.
  async onDisable(context) {
    return;
  },

  async run(context) {
    const payloadBody = context.payload.body as {
      type: string;
      data: { email_inbox_id: string };
    };
    const selectedInboxId = context.propsValue.inbox_id;

    if (payloadBody.type !== 'email.received') {
      return [];
    }

    if (
      selectedInboxId &&
      payloadBody.data.email_inbox_id !== selectedInboxId
    ) {
      return [];
    }

    return [payloadBody];
  },
});
