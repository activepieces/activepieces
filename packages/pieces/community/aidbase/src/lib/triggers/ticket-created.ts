import { createTrigger, TriggerStrategy } from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { ticketFormDropdown } from '../common/props';

export const ticketCreated = createTrigger({
  auth: aidbaseAuth,
  name: 'ticket_created',
  displayName: 'Ticket Created',
  description: 'Fires when a new ticket is created in Aidbase.',

  props: {
    ticket_form_id: ticketFormDropdown,
  },

  sampleData: {
    id: 'evt_1Hc2X2JZ6qsJ5XQ',
    type: 'ticket.created',
    data: {
      id: 'a36306fa-0cc4-4497-8c2a-c7798cfdc720',
      ticket_form_id: 'I2o6Ii_4U6m48bmKTTMoR',
      status: 'OPEN',
      priority: 'MEDIUM',
      field_values: [
        { id: 'uv9xA', name: 'Your name', type: 'TEXT', value: 'John Doe' },
      ],
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
      data: { ticket_form_id: string };
    };
    const { ticket_form_id } = context.propsValue;

    if (payloadBody.type !== 'ticket.created') {
      return [];
    }

    if (ticket_form_id && payloadBody.data.ticket_form_id !== ticket_form_id) {
      return [];
    }

    return [payloadBody];
  },
});
