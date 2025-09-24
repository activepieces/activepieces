import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { emailInboxDropdown } from '../common/props';

export const emailPriorityChanged = createTrigger({
  auth: aidbaseAuth,
  name: 'email_priority_changed',
  displayName: 'Email Priority Changed',
  description: 'Fires when an email’s priority is changed.',

  props: {
    inbox_id: emailInboxDropdown,

    priority: Property.StaticDropdown({
      displayName: 'New Priority',
      description:
        'Select the priority to trigger on. Leave blank to trigger for any priority change.',
      required: false,
      options: {
        options: [
          { label: 'Low', value: 'LOW' },
          { label: 'Medium', value: 'MEDIUM' },
          { label: 'High', value: 'HIGH' },
        ],
      },
    }),
  },

  sampleData: {
    id: 'evt_1Hc2a8f36qsa23e',
    type: 'email.priority.changed',
    changes: {
      priority: {
        previous: 'MEDIUM',
        new: 'HIGH',
      },
    },
    data: {
      id: '7c3c5609-b838-4643-8e8c-2a2da0a14c4a',
      email_inbox_id: '286d123e-5961-457c-8fd5-56f192ec315d',
      priority: 'HIGH',
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
      changes: { priority: { new: string } };
      data: { email_inbox_id: string };
    };
    const { inbox_id, priority } = context.propsValue;

    if (payloadBody.type !== 'email.priority.changed') {
      return [];
    }

    if (inbox_id && payloadBody.data.email_inbox_id !== inbox_id) {
      return [];
    }

    if (priority && payloadBody.changes.priority.new !== priority) {
      return [];
    }

    return [payloadBody];
  },
});
