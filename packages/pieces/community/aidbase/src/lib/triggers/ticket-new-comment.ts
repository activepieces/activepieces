import {
  createTrigger,
  Property,
  TriggerStrategy,
} from '@activepieces/pieces-framework';
import { aidbaseAuth } from '../common/auth';
import { ticketFormDropdown } from '../common/props';

export const ticketNewComment = createTrigger({
  auth: aidbaseAuth,
  name: 'ticket_new_comment',
  displayName: 'Ticket New Comment',
  description: 'Fires when a new comment is added to an existing ticket.',

  props: {
    ticket_form_id: ticketFormDropdown,

    commenter_type: Property.StaticDropdown({
      displayName: 'Commenter Type',
      description:
        'Select the type of commenter to trigger on. Leave blank for all comments.',
      required: false,
      options: {
        options: [
          { label: 'User (Customer)', value: 'USER' },
          { label: 'Agent (Support Staff)', value: 'AGENT' },
        ],
      },
    }),
  },

  sampleData: {
    id: 'evt_1Hc2X2JZ6qsJ5XQ',
    type: 'ticket.new.comment',
    changes: {
      comment: {
        id: '443968de-64d8-4018-9185-ffb9afb4751d',
        type: 'AGENT',
        comment: 'Great question! Here is the answer...',
      },
    },
    data: {
      id: 'a36306fa-0cc4-4497-8c2a-c7798cfdc720',
      ticket_form_id: 'I2o6Ii_4U6m48bmKTTMoR',
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
      changes: { comment: { type: string } };
      data: { ticket_form_id: string };
    };
    const { ticket_form_id, commenter_type } = context.propsValue;

    if (payloadBody.type !== 'ticket.new.comment') {
      return [];
    }

    if (ticket_form_id && payloadBody.data.ticket_form_id !== ticket_form_id) {
      return [];
    }

    if (commenter_type && payloadBody.changes.comment.type !== commenter_type) {
      return [];
    }

    return [payloadBody];
  },
});
