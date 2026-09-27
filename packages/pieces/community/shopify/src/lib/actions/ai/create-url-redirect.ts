import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlUrlRedirect,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { urlRedirectOutputSchema } from '../../output-schemas/content';

export const shopifyAiCreateUrlRedirect = createAction({
  auth: shopifyAuth,
  name: 'create_url_redirect',
  classification: 'WRITE',
  displayName: 'Create URL Redirect',
  description: 'Redirect an old online store path to a new URL.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a URL redirect so visitors of an old storefront path (for example "/old-page") are sent to a target path or full URL (for example "/pages/new-page"). The redirect is live immediately. Shopify refuses a second redirect for the same path, so check list_url_redirects with "path:<path>" before retrying. Needs the write_online_store_navigation access scope.',
    idempotent: false,
  },
  outputSchema: urlRedirectOutputSchema,
  props: {
    path: Property.ShortText({
      displayName: 'Old Path',
      description: 'The path to redirect from, starting with "/", for example "/old-page" or "/collections/summer-2025".',
      required: true,
    }),
    target: Property.ShortText({
      displayName: 'Target',
      description: 'Where to send visitors: a path such as "/pages/new-page" or a full URL such as "https://example.com/new".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const path = shopifyValues.nonEmpty(propsValue.path);
    const target = shopifyValues.nonEmpty(propsValue.target);
    if (!path || !target) {
      throw new Error('A redirect needs both a path and a target. Nothing was created.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      urlRedirectCreate: { urlRedirect: GqlUrlRedirect | null } | null;
    }>({
      auth,
      query: `mutation CreateUrlRedirect($urlRedirect: UrlRedirectInput!) { urlRedirectCreate(urlRedirect: $urlRedirect) { urlRedirect { ${shopifyFields.URL_REDIRECT_FIELDS} } userErrors { field message code } } }`,
      variables: { urlRedirect: { path, target } },
    });
    const created = data.urlRedirectCreate?.urlRedirect;
    if (!created) {
      throw new Error('Shopify did not return the created redirect.');
    }
    return {
      ...shopifyMappers.mapUrlRedirect(created),
      redacted_fields: redactedFields,
    };
  },
});
