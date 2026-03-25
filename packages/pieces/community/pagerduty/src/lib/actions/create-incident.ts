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
      description: 'Detailed incident body text.',
      required: true,
    }),
  },
  async run(context) {
    const { fromEmail, serviceId, title, urgency, details } = context.propsValue;

    const response = await pagerDutyApiCall({
      apiKey: context.auth.secret_text,
      method: HttpMethod.POST,
      path: '/incidents',
      fromEmail,
      body: {
        incident: {
          type: 'incident',
          title,
          service: {
            id: serviceId,
            type: 'service_reference',
          },
          urgency,
          body: {
            type: 'incident_body',
            details,
          },
        },
      },
    });

    return (response as { incident?: unknown }).incident ?? response;
  },
});
