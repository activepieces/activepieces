import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskRecoverSuspendedTicketsOutputSchema } from '../../../output-schemas';

export const zendeskRecoverSuspendedTickets = createAction({
  auth: zendeskAuth,
  name: 'zendesk_recover_suspended_tickets',
  outputSchema: zendeskRecoverSuspendedTicketsOutputSchema,
  displayName: 'Recover Suspended Tickets',
  description: 'Turn up to 100 suspended tickets into regular tickets.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Recovers up to 100 suspended tickets, turning each held message into a regular ticket (or a comment on the ticket it replied to). Suspended ticket IDs come from List Suspended Tickets. Not idempotent: a recovered suspended ticket no longer exists. Requires an unrestricted agent.',
    idempotent: false,
  },
  props: {
    suspended_ticket_ids: Property.Array({
      displayName: 'Suspended Ticket IDs',
      description: 'Up to 100 suspended ticket IDs, from List Suspended Tickets.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const ids = zendeskApi.idList({ values: propsValue.suspended_ticket_ids, label: 'Suspended Ticket IDs', max: 100 });
    const response = await zendeskApi.request<{ tickets: unknown[] }>({
      auth,
      method: HttpMethod.PUT,
      path: '/suspended_tickets/recover_many.json',
      queryParams: { ids: ids.join(',') },
    });
    return { tickets: response.tickets, count: response.tickets.length };
  },
});
