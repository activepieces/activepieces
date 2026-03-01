import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { emailInboxDropdown } from '../common/props';

export const emailStatusChanged = createTrigger({
  auth: aidbaseAuth,
  name: 'email_status_changed',
  displayName: 'Email Status Changed',
  description: 'Fires when the status of an email changes.',

  props: {
    inbox_id: emailInboxDropdown,

    status: Property.StaticDropdown({
      displayName: 'New Status',
      description:
        'Select the status to trigger on. Leave blank to trigger for any status change.',
      required: false,
      options: {
        options: [
          { label: 'Opened', value: 'OPEN' },
          { label: 'Assigned', value: 'ASSIGNED' },
          { label: 'Need More Info', value: 'NEED_MORE_INFO' },
          { label: 'Resolved', value: 'RESOLVED' },
          { label: 'Closed', value: 'CLOSED' },
        ],
      },
    }),
  },

  sampleData: {
    id: 'evt_1Hc2a8f36qsa23e',
    webhook_id: 'c1042e89-fea5-415c-8bd2-e557abf25307',
    object: 'webhook_event',
    created: '2023-10-31T17:36:56.491Z',
    type: 'email.status.changed',
    changes: {
      status: {
        previous: 'ASSIGNED',
        new: 'RESOLVED',
      },
    },
    data: {
      id: '7c3c5609-b838-4643-8e8c-2a2da0a14c4a',
      email_inbox_id: '286d123e-5961-457c-8fd5-56f192ec315d',
      status: 'RESOLVED',
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
      changes: { status: { new: string } };
      data: { email_inbox_id: string };
    };
    const { inbox_id, status } = context.propsValue;

    if (payloadBody.type !== 'email.status.changed') {
      return [];
    }

    if (inbox_id && payloadBody.data.email_inbox_id !== inbox_id) {
      return [];
    }

    if (status && payloadBody.changes.status.new !== status) {
      return [];
    }

    return [payloadBody];
  },
});
