import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pagerDutyAuth } from '../auth';
import { pagerDutyApiCall } from '../common/client';
import { fromEmailProp, incidentIdProp } from '../common/props';

export const acknowledgeIncident = createAction({
  auth: pagerDutyAuth,
  name: 'acknowledge_incident',
  displayName: 'Acknowledge Incident',
  description: 'Acknowledge an existing PagerDuty incident.',
  props: {
    incidentId: incidentIdProp,
    fromEmail: fromEmailProp,
  },
  async run(context) {
    const { incidentId, fromEmail } = context.propsValue;

    const response = await pagerDutyApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: `/incidents/${encodeURIComponent(incidentId)}`,
      fromEmail,
      body: {
        incident: {
          type: 'incident',
          status: 'acknowledged',
        },
      },
    });

    return (response as { incident?: unknown }).incident ?? response;
  },
});
