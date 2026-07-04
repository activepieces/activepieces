import { createAction, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { villageAuth, VILLAGE_API_BASE_URL } from '../../common/auth';

export const resyncIntegration = createAction({
  auth: villageAuth,
  name: 'resync_integration',
  displayName: 'Reset Integration',
  description:
    'Trigger a full resync of a Google or LinkedIn integration. Clears sync cursors and re-imports all contacts/calendar data; all graph operations use MERGE so it is fully idempotent.',
  audience: 'both',
  aiMetadata: {
    description:
      'Trigger a full resync of a Google or LinkedIn integration by numeric ID, clearing sync cursors and re-importing all contacts and calendar data. Idempotent: graph writes use MERGE, so repeating it re-imports without creating duplicates. Use when synced network data looks stale or incomplete.',
    idempotent: true,
  },
  props: {
    id: Property.Number({
      displayName: 'Integration ID',
      description: 'Numeric ID of the integration to resync',
      required: true,
    }),
  },
  async run(context) {
    const { id } = context.propsValue;

    const response = await httpClient.sendRequest({
      method: HttpMethod.POST,
      url: `${VILLAGE_API_BASE_URL}/v2/integrations/${id}/resync`,
      headers: { Authorization: `Bearer ${context.auth.secret_text}` },
    });
    return response.body;
  },
});
