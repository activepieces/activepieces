import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlMetaobject,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listMetaobjectsOutputSchema } from '../../output-schemas/content';

const MAX_PAGE_SIZE = 50;

export const shopifyAiListMetaobjects = createAction({
  auth: shopifyAuth,
  name: 'list_metaobjects',
  classification: 'SEARCH',
  displayName: 'List Metaobject Entries',
  description: 'List or search the entries of one metaobject type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the entries of one metaobject type (for example "designer" or "shopify--color-pattern"; see list_metaobject_definitions for the types) with handle, display name, publish status, every field value (fields and a values map keyed by field key) and dates. Filter with Shopify search syntax such as "display_name:Ada" or "fields.country:France". Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read_metaobjects access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listMetaobjectsOutputSchema,
  props: {
    type: Property.ShortText({
      displayName: 'Metaobject Type',
      description: 'The metaobject definition type, for example "designer". Find it with list_metaobject_definitions.',
      required: true,
    }),
    query: shopifyProps.searchQuery(
      'Shopify metaobject search syntax, for example "display_name:Ada" or "fields.country:France". Leave empty to list all.'
    ),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'id' },
          { label: 'Display name', value: 'display_name' },
          { label: 'Updated at', value: 'updated_at' },
          { label: 'Type', value: 'type' },
        ],
      },
    }),
    reverse: shopifyProps.reverse(),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const type = shopifyValues.nonEmpty(propsValue.type);
    if (!type) {
      throw new Error('A metaobject type is required, for example "designer".');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      metaobjects: GqlConnection<GqlMetaobject>;
    }>({
      auth,
      query: `query ListMetaobjects($type: String!, $first: Int!, $after: String, $query: String, $sortKey: String, $reverse: Boolean) { metaobjects(type: $type, first: $first, after: $after, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.METAOBJECT_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        type,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.metaobjects,
      map: shopifyMappers.mapMetaobject,
      redactedFields,
    });
  },
});
