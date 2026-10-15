import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskCreateManyTicketsOutputSchema } from '../../../output-schemas';

export const zendeskCreateManyTickets = createAction({
  auth: zendeskAuth,
  name: 'zendesk_create_many_tickets',
  outputSchema: zendeskCreateManyTicketsOutputSchema,
  displayName: 'Create Many Tickets',
  description: 'Queue the creation of up to 100 tickets.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Queues a background job that creates up to 100 tickets and returns the job status, not the tickets. Poll Get Job Status with the returned id until status is completed; its results list the new ticket IDs. Each ticket object needs a comment, e.g. {"subject": "...", "comment": {"body": "..."}, "requester": {"email": "..."}}. Not idempotent. Use Create Ticket for a single ticket.',
    idempotent: false,
  },
  props: {
    tickets: Property.Json({
      displayName: 'Tickets',
      description: 'JSON array of up to 100 ticket objects in the Zendesk Tickets API format.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const tickets = zendeskApi.jsonArray({ value: propsValue.tickets, label: 'Tickets' }) ?? [];
    if (tickets.length === 0 || tickets.length > 100) {
      throw new Error(`Tickets must hold 1 to 100 ticket objects, got ${tickets.length}.`);
    }
    const response = await zendeskApi.request<{ job_status: Record<string, unknown> }>({
      auth,
      method: HttpMethod.POST,
      path: '/tickets/create_many.json',
      body: { tickets },
    });
    return response.job_status;
  },
});
