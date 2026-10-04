import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListTicketAuditsOutputSchema } from '../../../output-schemas';

export const zendeskListTicketAudits = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_ticket_audits',
  outputSchema: zendeskListTicketAuditsOutputSchema,
  displayName: 'List Ticket Audits',
  description: 'List the change history of a ticket.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the audit trail of one ticket: every update, oldest first, with its author, channel and events (field changes, comments, notifications, triggers fired). Use it to answer who changed what and when; use List Ticket Comments when only the conversation matters.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const response = await zendeskApi.request<{ audits: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/tickets/${ticketId}/audits.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      audits: response.audits,
      count: response.audits.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
