import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import { removeTagsOutputSchema } from '../../output-schemas/orders';

export const shopifyAiRemoveTags = createAction({
  auth: shopifyAuth,
  name: 'remove_tags',
  classification: 'WRITE',
  displayName: 'Remove Tags',
  description: 'Remove tags from an order, draft order, customer, product or blog article.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Removes one or more tags from an order, draft order, customer, product or blog article and keeps the others; prefer this over sending a full tag list to an update action. Removing a tag that is not present changes nothing, so repeating is safe. Returns the resulting tag list. Blog articles need the write_content access scope.',
    idempotent: true,
  },
  outputSchema: removeTagsOutputSchema,
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
          { label: 'Blog article', value: 'Article' },
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
      description: 'Tags to remove, for example ["follow-up"].',
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
      tagsRemove: { node: TaggedNode | null } | null;
    }>({
      auth,
      query: `mutation RemoveTags($id: ID!, $tags: [String!]!) { tagsRemove(id: $id, tags: $tags) { node { id ${TAGGED_NODE_FRAGMENTS} } userErrors { field message } } }`,
      variables: { id, tags },
    });
    return {
      id: data.tagsRemove?.node?.id ?? id,
      tags_removed: tags.join(', '),
      tags: Array.isArray(data.tagsRemove?.node?.tags) ? data.tagsRemove?.node?.tags?.join(', ') ?? null : null,
      redacted_fields: redactedFields,
    };
  },
});

const TAGGED_NODE_FRAGMENTS =
  '... on Order { tags } ... on DraftOrder { tags } ... on Customer { tags } ... on Product { tags } ... on Article { tags }';

type TaggedNode = {
  id: string;
  tags?: string[] | null;
};
