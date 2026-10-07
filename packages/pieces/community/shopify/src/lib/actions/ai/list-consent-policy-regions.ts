import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConsentPolicyRegion,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { listConsentPolicyRegionsOutputSchema } from '../../output-schemas/store';

export const shopifyAiListConsentPolicyRegions = createAction({
  auth: shopifyAuth,
  name: 'list_consent_policy_regions',
  classification: 'SEARCH',
  displayName: 'List Consent Policy Regions',
  description: 'List the countries and regions a privacy consent policy can be set for.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the countries and regions (ISO 3166 country code plus optional region code) for which Shopify lets the store create or update a customer privacy consent policy. It does not say which policies exist; use list_consent_policies for that. Returns the full list in one call (no paging). The read_privacy_settings access scope is expected (not stated on the query page; to be confirmed). Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: listConsentPolicyRegionsOutputSchema,
  async run({ auth }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      consentPolicyRegions: GqlConsentPolicyRegion[] | null;
    }>({
      auth,
      query: `query ListConsentPolicyRegions { consentPolicyRegions { ${shopifyFields.CONSENT_POLICY_REGION_FIELDS} } }`,
    });
    const items = (data.consentPolicyRegions ?? []).map(shopifyMappers.mapConsentPolicyRegion);
    return {
      items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});
