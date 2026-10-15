import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { GqlReturnPolicyProfile, marketsFields, marketsMappers } from '../../common/markets';
import { returnPolicyProfileOutputSchema } from '../../output-schemas/markets';

export const shopifyAiGetReturnPolicyProfile = createAction({
  auth: shopifyAuth,
  name: 'get_return_policy_profile',
  classification: 'READ',
  displayName: 'Get Return Policy Profile',
  description: 'Get one return policy profile with its return and cancellation rules and markets.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one return policy profile: name (empty for the default profile), is_default, updated_at, the return rules (return_rules_enabled; when false returns are unrestricted; can_accept_returns, return_window_days where -1 is unlimited, return_window_starting_from, extend_window_to_business_day), the edit/cancellation rules (edit_rules_enabled, can_accept_edits, edit_window_minutes where -1 means until fulfillment) and the markets it applies to. Get the id from list_return_policy_profiles, or from return_policy_profile_id in list_markets / get_market. Needs the read_legal_policies access scope; market names also need read_markets. Read-only.',
    idempotent: true,
  },
  props: {
    return_policy_profile_id: Property.ShortText({
      displayName: 'Return Policy Profile ID',
      description:
        'The profile id, numeric or "gid://shopify/ReturnPolicyProfile/…". Find it with list_return_policy_profiles or in a market\'s return_policy_profile_id.',
      required: true,
    }),
  },
  outputSchema: returnPolicyProfileOutputSchema,
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'ReturnPolicyProfile', id: propsValue.return_policy_profile_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      returnPolicyProfile: GqlReturnPolicyProfile | null;
    }>({
      auth,
      query: `query GetReturnPolicyProfile($id: ID!) { returnPolicyProfile(id: $id) { ${marketsFields.RETURN_POLICY_PROFILE_FIELDS} } }`,
      variables: { id },
    });
    if (!data.returnPolicyProfile) {
      throw new Error(`Return policy profile ${id} was not found. Find ids with list_return_policy_profiles.`);
    }
    return {
      ...marketsMappers.mapReturnPolicyProfile(data.returnPolicyProfile),
      redacted_fields: redactedFields,
    };
  },
});
