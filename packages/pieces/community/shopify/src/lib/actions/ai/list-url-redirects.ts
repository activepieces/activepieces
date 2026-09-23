import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlUrlRedirect,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListUrlRedirects = createAction({
  auth: shopifyAuth,
  name: 'list_url_redirects',
  classification: 'SEARCH',
  displayName: 'List URL Redirects',
  description: 'List or search the online store\'s URL redirects.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the online store\'s URL redirects, each with its old path and target. Filter with Shopify search syntax such as "path:/old-page" or "target:/collections/sale". Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_online_store_navigation access scope. Read-only.',
    idempotent: true,
  },
  props: {
    query: shopifyProps.searchQuery(
      'Shopify redirect search syntax, for example "path:/old-page" or "target:/pages/new". Leave empty to list all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'ID' },
          { label: 'Path', value: 'PATH' },
          { label: 'Relevance (with a query)', value: 'RELEVANCE' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      urlRedirects: GqlConnection<GqlUrlRedirect>;
    }>({
      auth,
      query: `query ListUrlRedirects($first: Int!, $after: String, $query: String, $sortKey: UrlRedirectSortKeys, $reverse: Boolean) { urlRedirects(first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.URL_REDIRECT_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.urlRedirects,
      map: shopifyMappers.mapUrlRedirect,
      redactedFields,
    });
  },
});
