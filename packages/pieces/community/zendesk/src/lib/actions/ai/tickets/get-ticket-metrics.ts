import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetTicketMetricsOutputSchema } from '../../../output-schemas';

export const zendeskGetTicketMetrics = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_ticket_metrics',
  outputSchema: zendeskGetTicketMetricsOutputSchema,
  displayName: 'Get Ticket Metrics',
  description: 'Get response and resolution metrics for a ticket.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Fetches the metrics of one ticket: reply, reopen and assignee counts, first reply time, first and full resolution time, agent wait and requester wait time, in calendar and business minutes. Use List Ticket SLA Metrics for SLA targets and breaches.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const response = await zendeskApi.request<{ ticket_metric: Record<string, unknown> }>({
      auth,
      method: HttpMethod.GET,
      path: `/tickets/${ticketId}/metrics.json`,
    });
    return response.ticket_metric;
  },
});
