import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { CursorMeta, zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskListProblemTicketsOutputSchema } from '../../../output-schemas';

export const zendeskListProblemTickets = createAction({
  auth: zendeskAuth,
  name: 'zendesk_list_problem_tickets',
  outputSchema: zendeskListProblemTicketsOutputSchema,
  displayName: 'List Problem Tickets',
  description: 'List tickets of type problem.',
  audience: 'ai',
  classification: 'SEARCH',
  aiMetadata: {
    description:
      'Lists the tickets of type problem, which incidents can be linked to through Problem ID on Create Ticket or Update Ticket. Use List Ticket Incidents to see the incidents of one problem.',
    idempotent: true,
  },
  props: {
    limit: zendeskAiProps.limit(),
    cursor: zendeskAiProps.cursor(),
  },
  async run({ auth, propsValue }) {
    const response = await zendeskApi.request<{ tickets: unknown[]; meta?: CursorMeta }>({
      auth,
      method: HttpMethod.GET,
      path: `/problems.json`,
      queryParams: zendeskApi.cursorQuery({ limit: propsValue.limit, cursor: propsValue.cursor }),
    });
    return {
      tickets: response.tickets,
      count: response.tickets.length,
      ...zendeskApi.cursorResult(response.meta),
    };
  },
});
