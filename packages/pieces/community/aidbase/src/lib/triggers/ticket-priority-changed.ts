import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { ticketFormDropdown } from '../common/props';

export const ticketPriorityChanged = createTrigger({
  auth: aidbaseAuth,
  name: 'ticket_priority_changed',
  displayName: 'Ticket Priority Changed',
  description: 'Fires when the priority of an existing ticket changes.',

  props: {
    ticket_form_id: ticketFormDropdown,

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
    id: 'evt_1Hc2X2JZ6qsJ5XQ',
    type: 'ticket.priority.changed',
    changes: {
      priority: {
        previous: 'MEDIUM',
        new: 'HIGH',
      },
    },
    data: {
      id: 'a36306fa-0cc4-4497-8c2a-c7798cfdc720',
      ticket_form_id: 'I2o6Ii_4U6m48bmKTTMoR',
      status: 'OPEN',
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
      data: { ticket_form_id: string };
    };
    const { ticket_form_id, priority } = context.propsValue;

    if (payloadBody.type !== 'ticket.priority.changed') {
      return [];
    }

    if (ticket_form_id && payloadBody.data.ticket_form_id !== ticket_form_id) {
      return [];
    }

    if (priority && payloadBody.changes.priority.new !== priority) {
      return [];
    }

    return [payloadBody];
  },
});
