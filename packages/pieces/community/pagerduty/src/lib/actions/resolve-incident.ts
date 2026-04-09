import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pagerDutyAuth } from '../auth';
import { pagerDutyApiCall } from '../common/client';
import { fromEmailProp, incidentIdProp } from '../common/props';

export const resolveIncident = createAction({
  auth: pagerDutyAuth,
  name: 'resolve_incident',
  displayName: 'Resolve Incident',
  description: 'Resolve an existing PagerDuty incident.',
  props: {
    incidentId: incidentIdProp,
    fromEmail: fromEmailProp,
    resolution: Property.LongText({
      displayName: 'Resolution',
      description:
        'Optional resolution note. PagerDuty adds this to the resolve log entry.',
      required: false,
    }),
  },
  async run(context) {
    const { incidentId, fromEmail, resolution } = context.propsValue;

    const response = await pagerDutyApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: `/incidents/${encodeURIComponent(incidentId)}`,
      fromEmail,
      body: {
        incident: {
          type: 'incident',
          status: 'resolved',
          ...(resolution
            ? { body: { type: 'incident_body', details: resolution } }
            : {}),
        },
      },
    });

    return (response as { incident?: unknown }).incident ?? response;
  },
});
