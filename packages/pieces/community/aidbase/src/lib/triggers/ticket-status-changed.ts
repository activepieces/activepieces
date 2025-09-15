import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { ticketFormDropdown } from '../common/props';

export const ticketStatusChanged = createTrigger({
  auth: aidbaseAuth,
  name: 'ticket_status_changed',
  displayName: 'Ticket Status Changed',
  description: 'Fires when a ticket’s overall status changes.',

  props: {
    ticket_form_id: ticketFormDropdown,

    status: Property.StaticDropdown({
      displayName: 'New Status',
      description:
        'Select the status to trigger on. Leave blank to trigger for any status change.',
      required: false,
      options: {
        options: [
          { label: 'Open', value: 'OPEN' },
          { label: 'Assigned', value: 'ASSIGNED' },
          { label: 'Need More Info', value: 'NEED_MORE_INFO' },
          { label: 'Resolved', value: 'RESOLVED' },
          { label: 'Closed', value: 'CLOSED' },
        ],
      },
    }),
  },

  sampleData: {
    id: 'evt_1Hc2X2JZ6qsJ5XQ',
    type: 'ticket.status.changed',
    changes: {
      status: {
        previous: 'ASSIGNED',
        new: 'RESOLVED',
      },
    },
    data: {
      id: 'a36306fa-0cc4-4497-8c2a-c7798cfdc720',
      ticket_form_id: 'I2o6Ii_4U6m48bmKTTMoR',
      status: 'RESOLVED',
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
      changes: { status: { new: string } };
      data: { ticket_form_id: string };
    };
    const { ticket_form_id, status } = context.propsValue;
    console.log(payloadBody)
    if (payloadBody.type !== 'ticket.status.changed') {
      return [];
    }

    if (ticket_form_id && payloadBody.data.ticket_form_id !== ticket_form_id) {
      return [];
    }

    if (status && payloadBody.changes.status.new !== status) {
      return [];
    }

    return [payloadBody];
  },
});
