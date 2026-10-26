import { createAction } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlCount,
  shopifyGraphqlClient,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { contentCountOutputSchema } from '../../output-schemas/content';

export const shopifyAiCountUrlRedirects = createAction({
  auth: shopifyAuth,
  name: 'count_url_redirects',
  classification: 'READ',
  displayName: 'Count URL Redirects',
  description: 'Count the online store\'s URL redirects, optionally filtered.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Counts the online store\'s URL redirects, optionally filtered with search syntax such as "path:/collections". Shopify stops counting at 10,000 by default; precision is AT_LEAST when it did. Use list_url_redirects to see them. Needs the read_online_store_navigation access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: contentCountOutputSchema,
  props: {
    query: shopifyProps.searchQuery(
      'Shopify redirect search syntax, for example "path:/collections". Leave empty to count all.'
    ),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      urlRedirectsCount: GqlCount | null;
    }>({
      auth,
      query: `query CountUrlRedirects($query: String) { urlRedirectsCount(query: $query) { count precision } }`,
      variables: { query: shopifyValues.nonEmpty(propsValue.query) },
    });
    return {
      count: data.urlRedirectsCount?.count ?? 0,
      precision: data.urlRedirectsCount?.precision ?? null,
      redacted_fields: redactedFields,
    };
  },
});
