import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const acknowledgeIncidents = createAction({
  auth: coralogixAuth,
  name: 'acknowledgeIncidents',
  displayName: 'Acknowledge Incidents',
  description: 'Acknowledge one or more Coralogix incidents by incident ID.',
  requireAuth: true,
  props: {
    incidentIds: Property.Array({
      displayName: 'Incident IDs',
      description: 'List of incident IDs to acknowledge.',
      required: true,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const incidentIds = (propsValue.incidentIds ?? []) as string[];

    const queryString = incidentIds
      .map((id) => `incident_ids=${encodeURIComponent(id)}`)
      .join('&');
    const endpoint = `/mgmt/openapi/latest/incidents/incidents/v1/acknowledge?${queryString}`;
    
    const response = await makeRequest(
      auth,
      'management',
      HttpMethod.POST,
      endpoint
    );

    return response;
  },
});
