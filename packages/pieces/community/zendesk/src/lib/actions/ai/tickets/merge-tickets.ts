import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskMergeTicketsOutputSchema } from '../../../output-schemas';

export const zendeskMergeTickets = createAction({
  auth: zendeskAuth,
  name: 'zendesk_merge_tickets',
  outputSchema: zendeskMergeTicketsOutputSchema,
  displayName: 'Merge Tickets',
  description: 'Merge up to 5 tickets into a target ticket.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Queues a job that merges up to 5 source tickets into the target ticket: sources are closed and their comments are linked into the target. Irreversible. Returns the job status; poll Get Job Status with its id. Closed tickets cannot be merged in either direction.',
    idempotent: false,
  },
  props: {
    target_ticket_id: zendeskAiProps.ticketId({ description: 'The ticket that remains open and receives the merge.' }),
    source_ticket_ids: Property.Array({
      displayName: 'Source Ticket IDs',
      description: 'Up to 5 ticket IDs to merge into the target and close.',
      required: true,
    }),
    target_comment: Property.LongText({
      displayName: 'Target Comment',
      description: 'Comment added to the target ticket. Zendesk writes a default one when empty.',
      required: false,
    }),
    target_comment_is_public: Property.Checkbox({ displayName: 'Target Comment Is Public', required: false }),
    source_comment: Property.LongText({
      displayName: 'Source Comment',
      description: 'Comment added to each source ticket. Zendesk writes a default one when empty.',
      required: false,
    }),
    source_comment_is_public: Property.Checkbox({ displayName: 'Source Comment Is Public', required: false }),
  },
  async run({ auth, propsValue }) {
    const p = propsValue;
    const targetId = zendeskApi.id({ value: p.target_ticket_id, label: 'Target Ticket ID' });
    const ids = zendeskApi.idList({ values: p.source_ticket_ids, label: 'Source Ticket IDs', max: 5 });
    const response = await zendeskApi.request<{ job_status: Record<string, unknown> }>({
      auth,
      method: HttpMethod.POST,
      path: `/tickets/${targetId}/merge.json`,
      body: zendeskApi.compact({
        ids: ids.map(Number),
        target_comment: p.target_comment,
        target_comment_is_public: p.target_comment_is_public,
        source_comment: p.source_comment,
        source_comment_is_public: p.source_comment_is_public,
      }),
    });
    return response.job_status;
  },
});
