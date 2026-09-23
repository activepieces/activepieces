import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlUrlRedirect,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpdateUrlRedirect = createAction({
  auth: shopifyAuth,
  name: 'update_url_redirect',
  classification: 'WRITE',
  displayName: 'Update URL Redirect',
  description: 'Change the old path or the target of a URL redirect.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one URL redirect and returns it. Send a new path, a new target, or both; what you leave empty keeps its value. The change is live immediately. Repeating the same update leaves the same state. Needs the write_online_store_navigation access scope.',
    idempotent: true,
  },
  props: {
    url_redirect_id: Property.ShortText({
      displayName: 'URL Redirect ID',
      description: 'The redirect id, numeric or "gid://shopify/UrlRedirect/…". Find it with list_url_redirects.',
      required: true,
    }),
    path: Property.ShortText({
      displayName: 'Old Path',
      description: 'New path to redirect from, starting with "/".',
      required: false,
    }),
    target: Property.ShortText({
      displayName: 'Target',
      description: 'New target path or full URL.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const urlRedirect = shopifyValues.compact({
      path: shopifyValues.nonEmpty(propsValue.path),
      target: shopifyValues.nonEmpty(propsValue.target),
    });
    if (Object.keys(urlRedirect).length === 0) {
      throw new Error('Nothing to update: provide a new path or target. Nothing was changed.');
    }
    const id = shopifyGraphqlClient.toGid({ type: 'UrlRedirect', id: propsValue.url_redirect_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      urlRedirectUpdate: { urlRedirect: GqlUrlRedirect | null } | null;
    }>({
      auth,
      query: `mutation UpdateUrlRedirect($id: ID!, $urlRedirect: UrlRedirectInput!) { urlRedirectUpdate(id: $id, urlRedirect: $urlRedirect) { urlRedirect { ${shopifyFields.URL_REDIRECT_FIELDS} } userErrors { field message code } } }`,
      variables: { id, urlRedirect },
    });
    const updated = data.urlRedirectUpdate?.urlRedirect;
    if (!updated) {
      throw new Error('Shopify did not return the updated redirect.');
    }
    return {
      ...shopifyMappers.mapUrlRedirect(updated),
      redacted_fields: redactedFields,
    };
  },
});
