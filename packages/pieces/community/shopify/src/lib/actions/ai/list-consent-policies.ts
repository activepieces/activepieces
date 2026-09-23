import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConsentPolicy,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiListConsentPolicies = createAction({
  auth: shopifyAuth,
  name: 'list_consent_policies',
  classification: 'SEARCH',
  displayName: 'List Privacy Consent Policies',
  description: 'List the store\'s customer privacy consent policies per country or region.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s customer privacy consent policies: for each country (and optional region such as a US state), whether visitors must give consent before tracking and whether a data-sale opt-out is required. Optional filters: country_code, region_code, consent_required, data_sale_opt_out_required, or one policy id. Returns every match in one call (no paging). Use list_consent_policy_regions for the countries and regions a policy can exist for. The read_privacy_settings access scope is expected (not stated on the query page; to be confirmed). Read-only.',
    idempotent: true,
  },
  props: {
    country_code: Property.ShortText({
      displayName: 'Country Code',
      description: 'Only policies for this two-letter country code, for example "US" or "DE".',
      required: false,
    }),
    region_code: Property.ShortText({
      displayName: 'Region Code',
      description: 'Only policies for this region code within the country, for example "CA" for California.',
      required: false,
    }),
    consent_required: shopifyProps.booleanChoice({
      displayName: 'Consent Required',
      description: 'Yes returns only policies that require consent, No only those that do not. Leave empty for both.',
    }),
    data_sale_opt_out_required: shopifyProps.booleanChoice({
      displayName: 'Data Sale Opt-Out Required',
      description: 'Yes returns only policies that require a data-sale opt-out, No only those that do not. Leave empty for both.',
    }),
    policy_id: Property.ShortText({
      displayName: 'Policy ID',
      description: 'Only this policy, numeric or "gid://shopify/ConsentPolicy/…".',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const countryCode = shopifyValues.nonEmpty(propsValue.country_code)?.toUpperCase();
    if (countryCode !== undefined && !/^[A-Z]{2}$/.test(countryCode)) {
      throw new Error('country_code must be a two-letter code such as "US".');
    }
    const policyId = shopifyValues.nonEmpty(propsValue.policy_id);
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      consentPolicy: GqlConsentPolicy[] | null;
    }>({
      auth,
      query: `query ListConsentPolicies($id: ID, $countryCode: PrivacyCountryCode, $regionCode: String, $consentRequired: Boolean, $dataSaleOptOutRequired: Boolean) { consentPolicy(id: $id, countryCode: $countryCode, regionCode: $regionCode, consentRequired: $consentRequired, dataSaleOptOutRequired: $dataSaleOptOutRequired) { ${shopifyFields.CONSENT_POLICY_FIELDS} } }`,
      variables: shopifyValues.compact({
        id: policyId ? shopifyGraphqlClient.toGid({ type: 'ConsentPolicy', id: policyId }) : undefined,
        countryCode,
        regionCode: shopifyValues.nonEmpty(propsValue.region_code)?.toUpperCase(),
        consentRequired: shopifyValues.toBooleanChoice(propsValue.consent_required),
        dataSaleOptOutRequired: shopifyValues.toBooleanChoice(propsValue.data_sale_opt_out_required),
      }),
    });
    const items = (data.consentPolicy ?? []).map(shopifyMappers.mapConsentPolicy);
    return {
      items,
      count: items.length,
      redacted_fields: redactedFields,
    };
  },
});
