import { HttpMethod } from '@activepieces/pieces-common';
import { Property, createAction } from '@activepieces/pieces-framework';
import { moxieCRMAuth } from '../auth';
import { credentialsOf } from '../common';
import { moxieRequest } from '../common/client';
import { moxieInput, moxieProps } from '../common/props';
import { moxieActionOutputSchemas } from '../output-schemas';

export const moxieListTicketsAction = createAction({
  auth: moxieCRMAuth,
  name: 'moxie_list_tickets',
  classification: 'SEARCH',
  displayName: 'List Tickets',
  description: 'List tickets, optionally filtered by client, open state or archived state.',
  audience: 'both',
  aiMetadata: {
    description:
      'Lists Moxie tickets filtered by any mix of client id, open state and archived state; with no filters it returns every active ticket (archived ones only when Archived is Yes). Use to review open requests for a client or build a support report; use Search Tickets to match by text. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: moxieActionOutputSchemas.ticketList,
  props: {
    clientId: Property.ShortText({
      displayName: 'Client ID',
      description: 'Only tickets of this client, from Search Clients.',
      required: false,
    }),
    open: moxieProps.triState({
      displayName: 'Open',
      description: 'Yes returns only open tickets, No only closed ones. Leave empty for both.',
    }),
    archived: moxieProps.triState({
      displayName: 'Archived',
      description: 'Yes returns only archived tickets. No or empty returns active ones (the Moxie default).',
    }),
  },
  async run({ auth, propsValue }) {
    return moxieRequest<unknown>({
      credentials: credentialsOf({ auth }),
      method: HttpMethod.GET,
      path: '/action/tickets/list',
      query: {
        clientId: moxieInput.optionalId({ value: propsValue.clientId, field: 'Client ID' }),
        open: moxieInput.triState({ value: propsValue.open, field: 'Open' }),
        archived: moxieInput.triState({ value: propsValue.archived, field: 'Archived' }),
      },
    });
  },
});
