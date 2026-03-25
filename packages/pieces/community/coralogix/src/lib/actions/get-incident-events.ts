import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const getIncidentEvents = createAction({
  auth: coralogixAuth,
  name: 'getIncidentEvents',
  displayName: 'Get Incident Events',
  description: 'Get related events for a specific incident.',
  requireAuth: true,
  props: {
    incidentId: Property.ShortText({
      displayName: 'Incident ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const incidentId = propsValue.incidentId;

    return await makeRequest(
      auth,
      'management',
      HttpMethod.GET,
      `/mgmt/openapi/latest/incidents/incidents/v1/${encodeURIComponent(
        incidentId
      )}/events`
    );
  },
});

