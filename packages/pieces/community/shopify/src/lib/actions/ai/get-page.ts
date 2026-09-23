import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlPage,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetPage = createAction({
  auth: shopifyAuth,
  name: 'get_page',
  classification: 'READ',
  displayName: 'Get Online Store Page',
  description: 'Get one online store content page with its full body.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one online store content page: title, handle, full body HTML, body summary, publish state and date, and template suffix. Needs the read_content access scope. Read-only.',
    idempotent: true,
  },
  props: {
    page_id: Property.ShortText({
      displayName: 'Page ID',
      description: 'The page id, numeric or "gid://shopify/Page/…". Find it with list_pages.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'Page', id: propsValue.page_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      page: GqlPage | null;
    }>({
      auth,
      query: `query GetPage($id: ID!) { page(id: $id) { ${shopifyFields.PAGE_FIELDS} } }`,
      variables: { id },
    });
    if (!data.page) {
      throw new Error(`Page ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapPage(data.page),
      redacted_fields: redactedFields,
    };
  },
});
