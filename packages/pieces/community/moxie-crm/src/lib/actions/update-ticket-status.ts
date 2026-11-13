import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieUpdateTicketStatusAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_update_ticket_status',
  classification: 'WRITE',
  displayName: 'Update Ticket Status',
  description: 'Change the status of a ticket.',
  audience: 'both',
  aiMetadata: {
    description:
      'Changes only the workflow status of a Moxie ticket, identified by its id or its ticket number (give exactly one). The status must be one configured for the ticket type; an unknown status is rejected. Use to close or move a ticket after handling it. Idempotent: setting the same status again leaves the ticket unchanged.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.ticket,
  props: {
    ticketId: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'Exact ticket id, from Search Tickets. Give this or the ticket number.',
      required: false,
    }),
    ticketNumber: Property.Number({
      displayName: 'Ticket Number',
      description: 'The ticket number. Give this or the ticket id.',
      required: false,
    }),
    status: Property.ShortText({
      displayName: 'Status',
      description: 'Status label configured for the ticket type, for example Open.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = moxieInput.optionalId({ value: propsValue.ticketId, field: 'Ticket ID' });
    const ticketNumber = moxieInput.integer({ value: propsValue.ticketNumber, field: 'Ticket Number', min: 1 });
    if ((id === undefined) === (ticketNumber === undefined)) {
      throw new Error('Give exactly one of Ticket ID or Ticket Number.');
    }
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.PATCH,
      path: '/action/tickets/status',
      body: moxieInput.compact({
        values: { id, ticketNumber, status: moxieInput.requiredText({ value: propsValue.status, field: 'Status' }) },
      }),
      notFoundMessage: `No ticket ${id ?? `number ${ticketNumber}`} in this Moxie workspace.`,
    });
  },
});
