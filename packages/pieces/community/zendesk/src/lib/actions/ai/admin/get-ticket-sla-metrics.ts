import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { zendeskAuth } from '../../../auth';
import { zendeskApi } from '../../../common/api';
import { zendeskAiProps } from '../../../common/ai-props';
import { zendeskGetTicketSlaMetricsOutputSchema } from '../../../output-schemas';

export const zendeskGetTicketSlaMetrics = createAction({
  auth: zendeskAuth,
  name: 'zendesk_get_ticket_sla_metrics',
  outputSchema: zendeskGetTicketSlaMetricsOutputSchema,
  displayName: 'Get Ticket SLA Metrics',
  description: 'Get the SLA targets and breaches of a ticket.',
  audience: 'ai',
  classification: 'READ',
  aiMetadata: {
    description:
      'Lists the SLA metrics applied to one ticket (first reply, next reply, resolution time) with stage, breach time and whether they are breached. Requires the Professional plan or above. Use Get Ticket Metrics for raw timings.',
    idempotent: true,
  },
  props: {
    ticket_id: zendeskAiProps.ticketId(),
  },
  async run({ auth, propsValue }) {
    const ticketId = zendeskApi.id({ value: propsValue.ticket_id, label: 'Ticket ID' });
    const response = await zendeskApi.request<{ policy_metrics: unknown[] }>({
      auth,
      method: HttpMethod.GET,
      path: `/tickets/${ticketId}/slas/policy_metrics.json`,
    });
    return { policy_metrics: response.policy_metrics, count: response.policy_metrics.length };
  },
});
