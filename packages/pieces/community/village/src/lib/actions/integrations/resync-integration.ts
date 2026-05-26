import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const resyncIntegration = createAction({
  auth: villageAuth,
  name: 'resync_integration',
  displayName: 'Reset Integration',
  description:
    'Trigger a full resync of a Google or LinkedIn integration. Clears sync cursors and re-imports all contacts/calendar data; all graph operations use MERGE so it is fully idempotent.',
  props: {
    id: Property.ShortText({
      displayName: 'Integration ID',
      description: 'Integration ID',
      required: true,
    }),
  },
  async run(context) {
    const { id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/integrations/${encodeURIComponent(id)}/resync`,
      headers: { Authorization: `Bearer ${context.auth}` },
    });
    return response.body;
  },
});
