import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiGetGrantedAccessScopes = createAction({
  auth: shopifyAuth,
  name: 'get_granted_access_scopes',
  classification: 'READ',
  displayName: 'Get Granted Access Scopes',
  description: 'List the Admin API access scopes granted to the connected app.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the access scopes (for example read_orders, write_customers) granted to the connected custom app. Use it to diagnose an "access denied" or missing-scope error before retrying: if the scope is absent, the merchant must add it to the app and reinstall. Read-only.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      currentAppInstallation: {
        accessScopes?: { handle: string; description?: string | null }[] | null;
      };
    }>({
      auth,
      query: `query GetGrantedAccessScopes { currentAppInstallation { accessScopes { handle description } } }`,
    });
    const items = (data.currentAppInstallation.accessScopes ?? []).map((scope) => ({
      handle: scope.handle,
      description: scope.description ?? null,
    }));
    return {
      items,
      count: items.length,
      handles: items.map((item) => item.handle).join(', '),
      redacted_fields: redactedFields,
    };
  },
});
