import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlMetafieldDefinition,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listMetafieldDefinitionsOutputSchema } from '../../output-schemas/content';

const MAX_PAGE_SIZE = 45;

export const shopifyAiListMetafieldDefinitions = createAction({
  auth: shopifyAuth,
  name: 'list_metafield_definitions',
  classification: 'SEARCH',
  displayName: 'List Metafield Definitions',
  description: 'List the metafield definitions (custom field schemas) for one resource type.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the metafield definitions for one owner type (for example PRODUCT or CUSTOMER): name, namespace, key, type, description, validations, pinned position, access and capabilities, and how many values exist. Use it to learn which namespace, key and type set_metafields expects. Optionally filter by namespace, key, pinned status or a search query. Paged: pass end_cursor back as the cursor while has_next_page is true. Needs the read access scope of the owner type (for example read_products). Read-only.',
    idempotent: true,
  },
  outputSchema: listMetafieldDefinitionsOutputSchema,
  props: {
    owner_type: shopifyProps.metafieldOwnerType({
      required: true,
      description: 'The resource type the definitions belong to, for example PRODUCT.',
    }),
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description: 'Only definitions in this namespace, for example "custom".',
      required: false,
    }),
    key: Property.ShortText({
      displayName: 'Key',
      description: 'Only the definition with this key.',
      required: false,
    }),
    pinned_status: Property.StaticDropdown({
      displayName: 'Pinned Status',
      description: 'Only pinned or only unpinned definitions. Leave empty for all.',
      required: false,
      options: {
        options: [
          { label: 'Any', value: 'ANY' },
          { label: 'Pinned', value: 'PINNED' },
          { label: 'Unpinned', value: 'UNPINNED' },
        ],
      },
    }),
    query: shopifyProps.searchQuery('Free-text search over the definitions, for example "care". Leave empty for all.'),
    sort_key: Property.StaticDropdown({
      displayName: 'Sort By',
      description: 'Field to sort by. Defaults to the id.',
      required: false,
      options: {
        options: [
          { label: 'ID', value: 'ID' },
          { label: 'Name', value: 'NAME' },
          { label: 'Pinned position', value: 'PINNED_POSITION' },
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
      metafieldDefinitions: GqlConnection<GqlMetafieldDefinition>;
    }>({
      auth,
      query: `query ListMetafieldDefinitions($ownerType: MetafieldOwnerType!, $first: Int!, $after: String, $namespace: String, $key: String, $pinnedStatus: MetafieldDefinitionPinnedStatus, $query: String, $sortKey: MetafieldDefinitionSortKeys, $reverse: Boolean) { metafieldDefinitions(ownerType: $ownerType, first: $first, after: $after, namespace: $namespace, key: $key, pinnedStatus: $pinnedStatus, query: $query, sortKey: $sortKey, reverse: $reverse) { nodes { ${shopifyFields.METAFIELD_DEFINITION_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} } }`,
      variables: {
        ownerType: propsValue.owner_type,
        first: shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE }),
        after: shopifyValues.nonEmpty(propsValue.after),
        namespace: shopifyValues.nonEmpty(propsValue.namespace),
        key: shopifyValues.nonEmpty(propsValue.key),
        pinnedStatus: propsValue.pinned_status,
        query: shopifyValues.nonEmpty(propsValue.query),
        sortKey: propsValue.sort_key,
        reverse: propsValue.reverse ?? false,
      },
    });
    return shopifyMappers.toPage({
      connection: data.metafieldDefinitions,
      map: shopifyMappers.mapMetafieldDefinition,
      redactedFields,
    });
  },
});
