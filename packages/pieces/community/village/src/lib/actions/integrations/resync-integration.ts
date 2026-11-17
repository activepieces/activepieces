import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const resyncIntegration = createAction({
  auth: villageAuth,
  name: 'resync_integration',
  classification: 'WRITE',
  displayName: 'Reset Integration',
  description:
    'Trigger a full resync of a Google or LinkedIn integration. Clears sync cursors and re-imports all contacts/calendar data; all graph operations use MERGE so it is fully idempotent.',
  audience: 'both',
  aiMetadata: {
    description:
      'Trigger a full resync of a Google or LinkedIn integration by numeric ID, clearing sync cursors and re-importing all contacts and calendar data. Idempotent: graph writes use MERGE, so repeating it re-imports without creating duplicates. Use when synced network data looks stale or incomplete.',
    idempotent: true,
  },
  outputSchema: villageSchemas.integrationResult,
  props: {
    id: Property.Number({
      displayName: 'Integration ID',
      description: 'Numeric ID of the integration to resync',
      required: true,
    }),
  },
  async run(context) {
    const { id } = context.propsValue;

    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.POST,
      path: `/v2/integrations/${id}/resync`,
    });
    return response;
  },
});
