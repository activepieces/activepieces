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
  audience: 'both',
  aiMetadata: {
    description:
      'Sets an existing PagerDuty incident to the resolved status, requiring the incident ID and the acting user email (From); an optional resolution note is added to the resolve log entry. Use to close out an incident. Idempotent on the status — re-resolving leaves the incident resolved.',
    idempotent: true,
  },
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
