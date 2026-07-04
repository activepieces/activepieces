import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const resolveIncidents = createAction({
  auth: coralogixAuth,
  name: 'resolveIncidents',
  displayName: 'Resolve Incidents',
  description: 'Mark one or more Coralogix incidents as resolved.',
  audience: 'both',
  aiMetadata: { description: 'Marks one or more Coralogix incidents as resolved by incident ID; choose this for incidents that were actually fixed (use Close Incidents for false positives or noise). Idempotent: re-resolving already-resolved incidents yields the same state.', idempotent: true },
  requireAuth: true,
  props: {
    incidentIds: Property.Array({
      displayName: 'Incident IDs',
      description: 'List of incident IDs to resolve. Find the ID in Coralogix → Alerts → Incidents → click an incident → copy the ID from the URL.',
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
      `/mgmt/openapi/latest/incidents/incidents/v1/resolve?${queryString}`
    );
  },
});
