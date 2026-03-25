import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { pagerDutyAuth } from '../auth';
import { pagerDutyApiCall } from '../common/client';
import { fromEmailProp, serviceIdProp, urgencyProp } from '../common/props';

export const createIncident = createAction({
  auth: pagerDutyAuth,
  name: 'create_incident',
  displayName: 'Create Incident',
  description: 'Create a new PagerDuty incident using the REST API.',
  props: {
    fromEmail: fromEmailProp,
    serviceId: serviceIdProp,
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Incident title / summary.',
      required: true,
    }),
    urgency: urgencyProp,
    details: Property.LongText({
      displayName: 'Details',
      description: 'Optional detailed incident body text.',
      required: false,
    }),
  },
  async run(context) {
    const { fromEmail, serviceId, title, urgency, details } = context.propsValue;

    const incident: Record<string, unknown> = {
      type: 'incident',
      title,
      service: {
        id: serviceId,
        type: 'service_reference',
      },
      urgency,
    };

    if (details) {
      incident['body'] = {
        type: 'incident_body',
        details,
      };
    }

    const response = await pagerDutyApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/incidents',
      fromEmail,
      body: { incident },
    });

    return (response as { incident?: unknown }).incident ?? response;
  },
});
