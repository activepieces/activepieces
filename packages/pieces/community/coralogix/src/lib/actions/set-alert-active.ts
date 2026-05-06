import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const setAlertActive = createAction({
  auth: coralogixAuth,
  name: 'setAlertActive',
  displayName: 'Enable / Disable Alert',
  description:
    'Enable or disable a Coralogix alert definition. Use this to mute alerts during maintenance windows.',
  requireAuth: true,
  props: {
    alertId: Property.ShortText({
      displayName: 'Alert ID',
      description:
        'The ID of the alert to enable or disable. Use the "List Alert Definitions" action to find IDs.',
      required: true,
    }),
    active: Property.Checkbox({
      displayName: 'Enable Alert',
      description: 'Turn ON to enable the alert, turn OFF to disable it.',
      required: true,
      defaultValue: true,
    }),
  },
  async run({ auth, propsValue }) {
    const { alertId, active } = propsValue;

    return await makeRequest(
      auth,
      'management',
      HttpMethod.POST,
      `/mgmt/openapi/latest/alerts/alerts-general/v3/${encodeURIComponent(alertId)}:setActive?active=${active}`
    );
  },
});
