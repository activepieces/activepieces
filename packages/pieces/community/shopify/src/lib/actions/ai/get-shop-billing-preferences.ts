import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiGetShopBillingPreferences = createAction({
  auth: shopifyAuth,
  name: 'get_shop_billing_preferences',
  classification: 'READ',
  displayName: 'Get Shop Billing Currency',
  description: 'Get the currency the merchant pays Shopify and apps in.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the currency the merchant uses to pay for Shopify apps and services (their billing currency). This is not the currency customers pay in; for that use get_shop (currency_code) or list_enabled_currencies. No access scope needed. Read-only.',
    idempotent: true,
  },
  props: {},
  async run({ auth }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      shopBillingPreferences: { currency?: string | null } | null;
    }>({
      auth,
      query: `query GetShopBillingPreferences { shopBillingPreferences { currency } }`,
    });
    return {
      billing_currency: data.shopBillingPreferences?.currency ?? null,
      redacted_fields: redactedFields,
    };
  },
});
