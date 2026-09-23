import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';

export const shopifyAiPublishResource = createAction({
  auth: shopifyAuth,
  name: 'publish_resource',
  classification: 'WRITE',
  displayName: 'Publish Product or Collection',
  description: 'Publish a product or collection to one or more sales channels or catalogs.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publishes one product or collection to the given publications (find them with list_publications), making it visible on those channels, optionally from a future date. A product is only visible to customers when its status is ACTIVE. Publishing to a publication it is already on leaves it published. Needs the write_publications access scope.',
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
      description: 'Publications to publish to, for example ["gid://shopify/Publication/762454635"].',
      required: true,
    }),
    publish_date: Property.DateTime({
      displayName: 'Publish Date',
      description: 'Optional future date and time to publish at. Leave empty to publish now.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: propsValue.resource_type, id: propsValue.resource_id });
    const publicationIds = shopifyValues.toGidList({ type: 'Publication', value: propsValue.publication_ids });
    if (!publicationIds) {
      throw new Error('Provide at least one publication id. Find them with list_publications.');
    }
    const publishDate = shopifyValues.nonEmpty(propsValue.publish_date);
    const input = publicationIds.map((publicationId) => shopifyValues.compact({ publicationId, publishDate }));
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      publishablePublish: {
        publishable: {
          id?: string | null;
          title?: string | null;
          resourcePublicationsCount?: { count?: number | null } | null;
        } | null;
      } | null;
    }>({
      auth,
      query: `mutation PublishResource($id: ID!, $input: [PublicationInput!]!) { publishablePublish(id: $id, input: $input) { publishable { resourcePublicationsCount(onlyPublished: true) { count } ... on Product { id title } ... on Collection { id title } } userErrors { field message } } }`,
      variables: { id, input },
    });
    const publishable = data.publishablePublish?.publishable;
    return {
      id: publishable?.id ?? id,
      title: publishable?.title ?? null,
      published_publications_count: publishable?.resourcePublicationsCount?.count ?? null,
      publication_ids: publicationIds,
      redacted_fields: redactedFields,
    };
  },
});
