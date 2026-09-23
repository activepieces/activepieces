import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

export const shopifyAiUnpublishResource = createAction({
  auth: shopifyAuth,
  name: 'unpublish_resource',
  classification: 'DESTRUCTIVE',
  displayName: 'Unpublish Product or Collection',
  description: 'Remove a product or collection from one or more sales channels or catalogs.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Unpublishes one product or collection from the given publications (find them with list_publications), hiding it on those channels. The product or collection itself is not deleted and can be published again with publish_resource. Unpublishing from a publication it is not on leaves it unpublished. Needs the write_publications access scope.',
    idempotent: true,
  },
  props: {
    resource_type: Property.StaticDropdown({
      displayName: 'Resource Type',
      description: 'Whether the id is a product or a collection.',
      required: true,
      options: {
        options: [
          { label: 'Product', value: 'Product' },
          { label: 'Collection', value: 'Collection' },
        ],
      },
    }),
    resource_id: Property.ShortText({
      displayName: 'Resource ID',
      description: 'The product or collection id, numeric or a full id such as "gid://shopify/Product/632910392".',
      required: true,
    }),
    publication_ids: Property.Array({
      displayName: 'Publication IDs',
      description: 'Publications to unpublish from, for example ["gid://shopify/Publication/762454635"].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: propsValue.resource_type, id: propsValue.resource_id });
    const publicationIds = shopifyValues.toGidList({ type: 'Publication', value: propsValue.publication_ids });
    if (!publicationIds) {
      throw new Error('Provide at least one publication id. Find them with list_publications.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      publishableUnpublish: {
        publishable: {
          id?: string | null;
          title?: string | null;
          resourcePublicationsCount?: { count?: number | null } | null;
        } | null;
      } | null;
    }>({
      auth,
      query: `mutation UnpublishResource($id: ID!, $input: [PublicationInput!]!) { publishableUnpublish(id: $id, input: $input) { publishable { resourcePublicationsCount(onlyPublished: true) { count } ... on Product { id title } ... on Collection { id title } } userErrors { field message } } }`,
      variables: { id, input: publicationIds.map((publicationId) => ({ publicationId })) },
    });
    const publishable = data.publishableUnpublish?.publishable;
    return {
      id: publishable?.id ?? id,
      title: publishable?.title ?? null,
      published_publications_count: publishable?.resourcePublicationsCount?.count ?? null,
      publication_ids: publicationIds,
      redacted_fields: redactedFields,
    };
  },
});
