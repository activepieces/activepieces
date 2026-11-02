import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlDomain,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { domainOutputSchema } from '../../output-schemas/store';

export const shopifyAiGetDomain = createAction({
  auth: shopifyAuth,
  name: 'get_domain',
  classification: 'READ',
  displayName: 'Get Domain',
  description: 'Get one of the store\'s domains by id, or the primary domain.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one store domain: id, host, URL, whether SSL is on, its default and alternate languages and country, and the Markets web presence it serves (web_presence_id, subfolder suffix and root URLs per language). Leave domain_id empty to get the shop\'s primary domain. To find other domains, use list_web_presences (domain_id on each domain presence). Read-only. No access scope is documented for this query.',
    idempotent: true,
  },
  props: {
    domain_id: Property.ShortText({
      displayName: 'Domain ID',
      description: 'The domain id, numeric or "gid://shopify/Domain/…" (see domain_id from list_web_presences). Leave empty for the primary domain.',
      required: false,
    }),
  },
  outputSchema: domainOutputSchema,
  async run({ auth, propsValue }) {
    const domainId = shopifyValues.nonEmpty(propsValue.domain_id);
    if (!domainId) {
      const primary = await shopifyGraphqlClient.request<{
        shop: { primaryDomain: GqlDomain | null } | null;
      }>({
        auth,
        query: `query GetPrimaryDomain { shop { primaryDomain { ${shopifyFields.DOMAIN_FIELDS} } } }`,
      });
      const domain = primary.data.shop?.primaryDomain;
      if (!domain) {
        throw new Error('Shopify did not return the primary domain.');
      }
      return {
        ...shopifyMappers.mapDomain(domain),
        redacted_fields: primary.redactedFields,
      };
    }
    const id = shopifyGraphqlClient.toGid({ type: 'Domain', id: domainId });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      domain: GqlDomain | null;
    }>({
      auth,
      query: `query GetDomain($id: ID!) { domain(id: $id) { ${shopifyFields.DOMAIN_FIELDS} } }`,
      variables: { id },
    });
    if (!data.domain) {
      throw new Error(`Domain ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapDomain(data.domain),
      redacted_fields: redactedFields,
    };
  },
});
