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
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches a single PagerDuty incident by its incident ID. Use when you already have the ID and need the full current details of one incident. Read-only and idempotent.',
    idempotent: true,
  },
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
