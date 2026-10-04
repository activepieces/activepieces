import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListTicketFieldsOutputSchema } from '../../../output-schemas';

export const zendeskListTicketFields = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_ticket_fields',
  outputSchema: zendeskListTicketFieldsOutputSchema,
  displayName: 'List Ticket Fields',
  description: 'List system and custom ticket fields.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists ticket fields with their IDs, types and dropdown option values. Use the IDs and option values in Custom Fields on Create Ticket and Update Ticket.',
    idempotent: true,
  },
  props: {
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ ticket_fields: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/ticket_fields.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      ticket_fields: response.ticket_fields,
      count: response.ticket_fields.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
