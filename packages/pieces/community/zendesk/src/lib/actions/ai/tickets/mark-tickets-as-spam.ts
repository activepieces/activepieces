import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskCreateManyTicketsOutputSchema } from '../../../output-schemas';

export const zendeskMarkTicketsAsSpam = createAction({
  auth: zendeskAuth,
  name: 'zendesk_mark_tickets_as_spam',
  outputSchema: zendeskCreateManyTicketsOutputSchema,
  displayName: 'Mark Tickets as Spam',
  description: 'Mark up to 100 tickets as spam and suspend their requesters.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Queues a job that marks up to 100 tickets as spam: each ticket is deleted and its requester is suspended, so later email from them lands in suspended tickets. Use only for confirmed spam; use Delete Ticket to remove a ticket without suspending the requester. Returns the job status; poll Get Job Status with its id. Requires an agent with permission to delete tickets.',
    idempotent: true,
  },
  props: {
    ticket_ids: Property.Array({
      displayName: 'Ticket IDs',
      description: 'Up to 100 numeric ticket IDs.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const ids = zendeskApi.idList({ values: propsValue.ticket_ids, label: 'Ticket IDs', max: 100 });
    const response = await zendeskApi.request<{ job_status: Record<string, unknown> }>({
      auth,
      method: HttpMethod.PUT,
      path: '/tickets/mark_many_as_spam.json',
      queryParams: { ids: ids.join(',') },
    });
    return response.job_status;
  },
});
