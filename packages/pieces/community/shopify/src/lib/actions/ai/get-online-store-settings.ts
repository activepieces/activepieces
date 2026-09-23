import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiGetOnlineStoreSettings = createAction({
  auth: shopifyAuth,
  name: 'get_online_store_settings',
  classification: 'READ',
  displayName: 'Get Online Store Settings',
  description: 'Check whether the online store is password protected.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the online store channel settings Shopify exposes: password_protection_enabled is true while the storefront is locked behind a password (typical before launch or on development stores), so shoppers cannot see pages, articles or products yet. The required access scope is not documented. Read-only.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      onlineStore: { passwordProtection?: { enabled?: boolean | null } | null } | null;
    }>({
      auth,
      query: `query GetOnlineStoreSettings { onlineStore { passwordProtection { enabled } } }`,
    });
    return {
      password_protection_enabled: data.onlineStore?.passwordProtection?.enabled ?? null,
      redacted_fields: redactedFields,
    };
  },
});
