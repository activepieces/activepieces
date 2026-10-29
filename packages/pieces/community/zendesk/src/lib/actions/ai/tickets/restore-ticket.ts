import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskDeleteTicketOutputSchema } from '../../../output-schemas';

export const zendeskRestoreTicket = createAction({
  auth: zendeskAuth,
  name: 'zendesk_restore_ticket',
  outputSchema: zendeskDeleteTicketOutputSchema,
  displayName: 'Restore Ticket',
  description: 'Restore a soft-deleted ticket.',
  audience: 'ai',
  classification: 'WRITE',
  aiMetadata: {
    description:
      'Restores a ticket removed by Delete Ticket, as long as Zendesk has not purged it yet (30 days). Find candidates with List Deleted Tickets. Requires an admin or an agent with permission to delete tickets.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId({ description: 'Numeric ID of the deleted ticket, from List Deleted Tickets.' }),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    await zendeskApi.request<unknown>({
      auth,
      method: HttpMethod.PUT,
      path: `/deleted_tickets/${ticketId}/restore.json`,
    });
    return { success: true, ticket_id: Number(ticketId) };
  },
});
