import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetTicketConversationLogOutputSchema } from '../../../output-schemas';

export const zendeskGetTicketConversationLog = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_ticket_conversation_log',
  outputSchema: zendeskGetTicketConversationLogOutputSchema,
  displayName: 'Get Ticket Conversation Log',
  description: 'Get the messaging conversation of a ticket.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the conversation events of a messaging ticket (web widget, mobile SDK, social messaging), including end-user and bot messages that List Ticket Comments does not show. Email and API tickets return few or no events.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const response = await zendeskApi.request<{ events: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/tickets/${ticketId}/conversation_log.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      events: response.events,
      count: response.events.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
