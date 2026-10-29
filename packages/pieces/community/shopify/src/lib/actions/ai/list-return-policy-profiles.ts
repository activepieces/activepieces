import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { GqlReturnPolicyProfile, marketsFields, marketsMappers } from '../../common/markets';
import { listReturnPolicyProfilesOutputSchema } from '../../output-schemas/markets';

const MAX_PAGE_SIZE = 25;

export const shopifyAiListReturnPolicyProfiles = createAction({
  auth: shopifyAuth,
  name: 'list_return_policy_profiles',
  classification: 'SEARCH',
  displayName: 'List Return Policy Profiles',
  description: 'List the store\'s return policy profiles with their return and cancellation rules and markets.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the store\'s return policy profiles: the default profile (is_default true, name empty) and any market-specific ones. Use it to answer "what is the return window in market X" or "which markets use a custom return policy". Each item has id (for get_return_policy_profile), name, is_default, updated_at, the return rules (return_rules_enabled; when false returns are unrestricted; can_accept_returns, return_window_days where -1 is unlimited, return_window_starting_from, extend_window_to_business_day), the edit/cancellation rules (edit_rules_enabled, can_accept_edits, edit_window_minutes where -1 means until fulfillment) and the markets it applies to (id, name, handle; ids work with get_market). Set default to Yes for only the default profile or No for only the custom ones. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_legal_policies access scope; the market names also need read_markets and are listed in redacted_fields without it. Read-only.',
    idempotent: true,
  },
  props: {
    default: shopifyProps.booleanChoice({
      displayName: 'Default Profile Only',
      description: 'Yes returns only the default profile, No only the custom profiles. Leave empty for all.',
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  outputSchema: listReturnPolicyProfilesOutputSchema,
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      returnPolicyProfiles: GqlConnection<GqlReturnPolicyProfile> | null;
    }>({
      auth,
      query: `query ListReturnPolicyProfiles($first: Int!, $after: String, $reverse: Boolean, $default: Boolean) { returnPolicyProfiles(first: $first, after: $after, reverse: $reverse, default: $default) { nodes { ${marketsFields.RETURN_POLICY_PROFILE_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        reverse: propsValue.reverse ?? false,
        default: shopifyValues.toBooleanChoice(propsValue.default),
      },
    });
    return shopifyMappers.toPage({
      connection: data.returnPolicyProfiles,
      map: marketsMappers.mapReturnPolicyProfile,
      redactedFields,
    });
  },
});
