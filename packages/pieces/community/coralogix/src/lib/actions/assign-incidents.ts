import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const assignIncidents = createAction({
  auth: coralogixAuth,
  name: 'assignIncidents',
  displayName: 'Assign Incidents',
  description: 'Assign one or more Coralogix incidents to a specific user.',
  requireAuth: true,
  props: {
    incidentIds: Property.Array({
      displayName: 'Incident IDs',
      description:
        'List of incident IDs to assign. Find IDs via "List Incidents" or the Coralogix Incidents page URL.',
      required: true,
      defaultValue: [],
    }),
    assignToUserId: Property.ShortText({
      displayName: 'Assign To (User ID)',
      description: 'The Coralogix user ID to assign the incidents to.',
      required: true,
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
      `/mgmt/openapi/latest/incidents/incidents/v1/by-user?${queryString}`,
      { assigned_to: { user_id: propsValue.assignToUserId } }
    );
  },
});
