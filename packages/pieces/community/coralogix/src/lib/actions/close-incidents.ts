import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const closeIncidents = createAction({
  auth: coralogixAuth,
  name: 'closeIncidents',
  displayName: 'Close Incidents',
  description: 'Close one or more Coralogix incidents (e.g. false positives or noise). Use Resolve for incidents that were actually fixed.',
  requireAuth: true,
  props: {
    incidentIds: Property.Array({
      displayName: 'Incident IDs',
      description: 'List of incident IDs to close. Find the ID in Coralogix → Alerts → Incidents → click an incident → copy the ID from the URL.',
      required: true,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const incidentIds = (propsValue.incidentIds ?? []) as string[];

    const queryString = incidentIds
      .map((id) => `incident_ids=${encodeURIComponent(id)}`)
      .join('&');

    return await makeRequest(
      auth,
      'management',
      HttpMethod.POST,
      `/mgmt/openapi/latest/incidents/incidents/v1/close?${queryString}`
    );
  },
});
