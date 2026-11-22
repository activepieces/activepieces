import { createAction } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { villageAuth } from '../../common/auth';
import { villageApi } from '../../common/client';
import { villageSchemas } from '../../common/schemas';

export const listIntegrations = createAction({
  auth: villageAuth,
  name: 'list_integrations',
  classification: 'SEARCH',
  displayName: 'List Gmail Integrations',
  description:
    'Get all your connected Gmail integrations, including rate limits, timezone, the default sending account, and whether you can add more based on your plan.',
  audience: 'both',
  aiMetadata: {
    description:
      'List the caller\'s connected Gmail integrations with their rate limits, timezone, and default-sender status. Read-only and idempotent. Use to discover integration IDs before updating or resyncing one.',
    idempotent: true,
  },
  outputSchema: villageSchemas.listIntegrations,
  props: {},
  async run(context) {
    const response = await villageApi.call({
      token: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/v2/integrations`,
    });
    return response;
  },
});
