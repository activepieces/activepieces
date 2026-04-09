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
      description: 'Additional incident body text.',
      required: false,
    }),
    incidentKey: Property.ShortText({
      displayName: 'Incident Key',
      description:
        'A string that identifies the incident. Duplicate requests with the same key and open incident on the same service will be rejected (de-duplication).',
      required: false,
    }),
    assigneeIds: Property.Array({
      displayName: 'Assignee IDs',
      description:
        'Comma-separated list of PagerDuty user IDs to assign the incident to. Cannot be used together with Escalation Policy ID.',
      required: false,
    }),
    priorityId: Property.ShortText({
      displayName: 'Priority ID',
      description: 'The ID of the priority to assign to this incident.',
      required: false,
    }),
    conferenceNumber: Property.ShortText({
      displayName: 'Conference Number',
      description: 'Phone number of the conference bridge.',
      required: false,
    }),
    conferenceUrl: Property.ShortText({
      displayName: 'Conference URL',
      description: 'URL for the conference bridge.',
      required: false,
    }),
  },
  async run(context) {
    const {
      fromEmail,
      serviceId,
      title,
      urgency,
      details,
      incidentKey,
      assigneeIds,
      priorityId,
      conferenceNumber,
      conferenceUrl,
    } = context.propsValue;

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

    if (incidentKey) {
      incident['incident_key'] = incidentKey;
    }

    if (assigneeIds && assigneeIds.length > 0) {
      incident['assignments'] = (assigneeIds as string[]).map((id) => ({
        assignee: { id, type: 'user_reference' },
      }));
    }

    if (priorityId) {
      incident['priority'] = {
        id: priorityId,
        type: 'priority_reference',
      };
    }

    if (conferenceNumber || conferenceUrl) {
      const bridge: Record<string, string> = {};
      if (conferenceNumber) bridge['conference_number'] = conferenceNumber;
      if (conferenceUrl) bridge['conference_url'] = conferenceUrl;
      incident['conference_bridge'] = bridge;
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
