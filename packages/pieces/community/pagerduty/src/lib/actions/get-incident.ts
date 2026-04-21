import { HttpMethod } from '@activepieces/pieces-common';
import { createAction } from '@activepieces/pieces-framework';
import { pagerDutyAuth } from '../auth';
import { pagerDutyApiCall } from '../common/client';
import { incidentIdProp } from '../common/props';

export const getIncident = createAction({
  auth: pagerDutyAuth,
  name: 'get_incident',
  displayName: 'Get Incident',
  description: 'Retrieve a PagerDuty incident by ID.',
  props: {
    incidentId: incidentIdProp,
  },
  async run(context) {
    const response = await pagerDutyApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/incidents/${encodeURIComponent(context.propsValue.incidentId)}`,
    });

    return (response as { incident?: unknown }).incident ?? response;
  },
});
