import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlUrlRedirect,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { urlRedirectOutputSchema } from '../../output-schemas/content';

export const shopifyAiGetUrlRedirect = createAction({
  auth: shopifyAuth,
  name: 'get_url_redirect',
  classification: 'READ',
  displayName: 'Get URL Redirect',
  description: 'Get one URL redirect.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one URL redirect: the old path visitors arrive on and the target they are sent to. Use list_url_redirects with "path:/old-page" to find one by path. Needs the read_online_store_navigation access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: urlRedirectOutputSchema,
  props: {
    url_redirect_id: Property.ShortText({
      displayName: 'URL Redirect ID',
      description: 'The redirect id, numeric or "gid://shopify/UrlRedirect/…". Find it with list_url_redirects.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'UrlRedirect', id: propsValue.url_redirect_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      urlRedirect: GqlUrlRedirect | null;
    }>({
      auth,
      query: `query GetUrlRedirect($id: ID!) { urlRedirect(id: $id) { ${shopifyFields.URL_REDIRECT_FIELDS} } }`,
      variables: { id },
    });
    if (!data.urlRedirect) {
      throw new Error(`URL redirect ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapUrlRedirect(data.urlRedirect),
      redacted_fields: redactedFields,
    };
  },
});
