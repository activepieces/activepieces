import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { coralogixAuth } from '../common/auth';
import { makeRequest } from '../common/client';

export const getAlertEventsStatistics = createAction({
  auth: coralogixAuth,
  name: 'getAlertEventsStatistics',
  displayName: 'Get Alert Events Statistics',
  description: 'Get statistics for alert events in Coralogix.',
  requireAuth: true,
  props: {
    ids: Property.Array({
      displayName: 'IDs',
      description:
        'Optional list of alert definition IDs or event IDs to filter by.',
      required: false,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const ids = ((propsValue.ids ?? []) as string[])
      .map((id) => String(id))
      .filter((id) => id.length > 0);

    const queryParams: QueryParams = {};
    if (ids.length > 0) {
      queryParams['ids'] = ids.join(',');
    }

    return await makeRequest(
      auth,
      'management',
      HttpMethod.GET,
      '/mgmt/openapi/latest/v3/alert-event-stats',
      undefined,
      queryParams
    );
  },
});
