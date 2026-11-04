import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { freshserviceAuth } from '../../../';
import { freshserviceApiCall } from '../../common/client';
import { freshserviceCommon } from '../../common/props';
import { freshserviceSchemas } from '../../common/schemas';

export const aiAddTicketNote = createAction({
  auth: freshserviceAuth,
  name: 'ai_add_ticket_note',
  displayName: 'Add Ticket Note (AI)',
  description: 'Adds a note to a Freshservice ticket.',
  audience: 'ai',
  classification: 'WRITE',
  outputSchema: freshserviceSchemas.note,
  aiMetadata: {
    description:
      'Adds a note to a Freshservice ticket by numeric ticket id. Notes are private (agents only) unless private is "no". Use Reply to Ticket instead to email the requester. Not idempotent — each call adds another note.',
    idempotent: false,
  },
  props: {
    ticket_id: Property.Number({ displayName: 'Ticket ID', required: true }),
    body: Property.LongText({ displayName: 'Note', description: 'HTML is allowed.', required: true }),
    private: freshserviceCommon.yesNo({
      displayName: 'Private',
      description: 'yes (default) keeps the note visible to agents only.',
      required: false,
    }),
  },
  async run(context) {
    const { ticket_id, body, private: isPrivate } = context.propsValue;
    const response = await freshserviceApiCall<{ conversation: Record<string, unknown> }>({
      method: HttpMethod.POST,
      endpoint: `tickets/${ticket_id}/notes`,
      auth: context.auth,
      body: { body, private: isPrivate !== 'no' },
    });
    return response.body.conversation;
  },
});
