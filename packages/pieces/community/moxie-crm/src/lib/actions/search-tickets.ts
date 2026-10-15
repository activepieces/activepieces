import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieSearchTicketsAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_search_tickets',
  classification: 'SEARCH',
  displayName: 'Search Tickets',
  description: 'Find tickets by text, id or ticket number.',
  audience: 'both',
  aiMetadata: {
    description:
      'Searches Moxie tickets whose subject, status, summary or number matches the query (case-insensitive), or returns the one ticket with an exact Ticket ID or Ticket Number. Use to find a ticket before commenting on it or changing its status; use List Tickets to filter by client or open state. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.ticketList,
  props: {
    query: Property.ShortText({
      displayName: 'Query',
      description: 'Text to match in the subject, status, summary or number.',
      required: false,
    }),
    id: Property.ShortText({
      displayName: 'Ticket ID',
      description: 'Exact ticket id. Overrides the number and the query.',
      required: false,
    }),
    ticketNumber: Property.Number({
      displayName: 'Ticket Number',
      description: 'Exact ticket number. Overrides the query.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const query = moxieInput.text({ value: propsValue.query });
    const id = moxieInput.optionalId({ value: propsValue.id, field: 'Ticket ID' });
    const ticketNumber = moxieInput.integer({ value: propsValue.ticketNumber, field: 'Ticket Number', min: 1 });
    if (query === undefined && id === undefined && ticketNumber === undefined) {
      throw new Error('Enter a Query, a Ticket ID or a Ticket Number.');
    }
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.GET,
      path: '/action/tickets/search',
      query: { query, id, ticketNumber },
    });
  },
});
