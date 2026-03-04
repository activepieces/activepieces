import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const getIncidentById = createAction({
  auth: coralogixAuth,
  name: 'getIncidentById',
  displayName: 'Get Incident By ID',
  description: 'Retrieve a Coralogix incident by its incident ID.',
  requireAuth: true,
  props: {
    incidentId: Property.ShortText({
      displayName: 'Incident ID',
      description: 'The Coralogix incident ID to retrieve.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const incidentId = propsValue.incidentId;

    const response = await makeRequest(
      auth,
      'management',
      HttpMethod.GET,
      `/mgmt/openapi/latest/incidents/incidents/v1/${encodeURIComponent(
        incidentId
      )}`
    );

    return response;
  },
});
