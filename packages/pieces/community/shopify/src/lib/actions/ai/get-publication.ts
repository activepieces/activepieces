import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlPublication,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetPublication = createAction({
  auth: shopifyAuth,
  name: 'get_publication',
  classification: 'READ',
  displayName: 'Get Publication',
  description: 'Get one publication (sales channel or catalog) by id.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one publication by id: its title, catalog and whether new products are published to it automatically. Use list_publications to find publication ids. Needs the read_publications access scope. Read-only.',
    idempotent: true,
  },
  props: {
    publication_id: Property.ShortText({
      displayName: 'Publication ID',
      description: 'The publication id, numeric or "gid://shopify/Publication/…". Find it with list_publications.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Publication', id: propsValue.publication_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      publication: GqlPublication | null;
    }>({
      auth,
      query: `query GetPublication($id: ID!) { publication(id: $id) { ${shopifyFields.PUBLICATION_FIELDS} } }`,
      variables: { id },
    });
    if (!data.publication) {
      throw new Error(`Publication ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapPublication(data.publication),
      redacted_fields: redactedFields,
    };
  },
});
