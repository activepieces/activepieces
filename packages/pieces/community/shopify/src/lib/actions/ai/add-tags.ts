import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

export const shopifyAiAddTags = createAction({
  auth: shopifyAuth,
  name: 'add_tags',
  classification: 'WRITE',
  displayName: 'Add Tags',
  description: 'Add tags to an order, draft order, customer or product.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Adds one or more tags to an order, draft order, customer or product while keeping its existing tags; prefer this over sending a full tag list to an update action. Adding a tag that is already present changes nothing, so repeating is safe. Returns the resulting tag list.',
    idempotent: true,
  },
  props: {
    resource_type: Property.StaticDropdown({
      displayName: 'Resource Type',
      description: 'What kind of record the id belongs to. Used to build the full id when a numeric id is given.',
      required: true,
      options: {
        options: [
          { label: 'Order', value: 'Order' },
          { label: 'Draft order', value: 'DraftOrder' },
          { label: 'Customer', value: 'Customer' },
          { label: 'Product', value: 'Product' },
        ],
      },
    }),
    resource_id: Property.ShortText({
      displayName: 'Resource ID',
      description: 'Numeric id such as "450789469" or a full id such as "gid://shopify/Order/450789469".',
      required: true,
    }),
    tags: Property.Array({
      displayName: 'Tags',
      description: 'Tags to add, for example ["vip", "follow-up"].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const tags = shopifyValues.readStringList(propsValue.tags) ?? [];
    if (tags.length === 0) {
      throw new Error('Provide at least one tag.');
    }
    const id = shopifyGraphqlClient.toGid({ type: propsValue.resource_type, id: propsValue.resource_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      tagsAdd: { node: TaggedNode | null } | null;
    }>({
      auth,
      query: `mutation AddTags($id: ID!, $tags: [String!]!) { tagsAdd(id: $id, tags: $tags) { node { id ${TAGGED_NODE_FRAGMENTS} } userErrors { field message } } }`,
      variables: { id, tags },
    });
    return {
      id: data.tagsAdd?.node?.id ?? id,
      tags_added: tags.join(', '),
      tags: Array.isArray(data.tagsAdd?.node?.tags) ? data.tagsAdd?.node?.tags?.join(', ') ?? null : null,
      redacted_fields: redactedFields,
    };
  },
});

const TAGGED_NODE_FRAGMENTS =
  '... on Order { tags } ... on DraftOrder { tags } ... on Customer { tags } ... on Product { tags }';

type TaggedNode = {
  id: string;
  tags?: string[] | null;
};
