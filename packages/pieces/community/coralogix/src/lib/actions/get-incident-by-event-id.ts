import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const getIncidentByEventId = createAction({
  auth: coralogixAuth,
  name: 'getIncidentByEventId',
  displayName: 'Get Incident By Event ID',
  description: 'Get the incident associated with a Coralogix event ID.',
  requireAuth: true,
  props: {
    eventId: Property.ShortText({
      displayName: 'Event ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const eventId = propsValue.eventId;

    return await makeRequest(
      auth,
      'management',
      HttpMethod.GET,
      `/mgmt/openapi/latest/incidents/incidents/v1/events/${encodeURIComponent(
        eventId
      )}`
    );
  },
});
