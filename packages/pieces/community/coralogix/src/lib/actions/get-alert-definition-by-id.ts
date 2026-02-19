import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const getAlertDefinitionById = createAction({
  auth: coralogixAuth,
  name: 'getAlertDefinitionById',
  displayName: 'Get Alert Definition By ID',
  description: 'Get a Coralogix alert definition by ID.',
  requireAuth: true,
  props: {
    alertDefinitionId: Property.ShortText({
      displayName: 'Alert Definition ID',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const alertDefinitionId = propsValue.alertDefinitionId;
    if (!alertDefinitionId) {
      throw new Error('Alert Definition ID is required.');
    }

    return await makeRequest(
      auth,
      'management',
      HttpMethod.GET,
      `/mgmt/openapi/latest/alerts/alerts-general/v3/${encodeURIComponent(
        alertDefinitionId
      )}`
    );
  },
});
