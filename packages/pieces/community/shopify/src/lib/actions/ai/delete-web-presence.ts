import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';

export const shopifyAiDeleteWebPresence = createAction({
  auth: shopifyAuth,
  name: 'delete_web_presence',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Markets Web Presence',
  description: 'Remove a Markets web presence (a market\'s domain or subfolder storefront).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Deletes one Markets web presence: the domain or subfolder (for example example.com/fr-ca) through which a market\'s shoppers reach the storefront in their languages. Shoppers of those markets immediately lose that URL, links and search results pointing to it stop working, and there is no action here to recreate it (only the Shopify admin can), so confirm with the user first and name the URL being removed. Shopify may refuse to delete the web presence of the shop\'s primary domain (not yet confirmed on a store). Plan requirement: a web presence only exists when the store uses Markets with an extra domain or subfolder; get its id from list_web_presences (id), which covers subfolder presences too (they have no domain of their own). A repeat call fails because it is gone. Needs the read_markets and write_markets access scopes.',
    idempotent: false,
  },
  props: {
    web_presence_id: Property.ShortText({
      displayName: 'Web Presence ID',
      description: 'The web presence id, numeric or "gid://shopify/MarketWebPresence/…" (see id from list_web_presences).',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'MarketWebPresence', id: propsValue.web_presence_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      webPresenceDelete: { deletedId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteWebPresence($id: ID!) { webPresenceDelete(id: $id) { deletedId userErrors { field message code } } }`,
      variables: { id },
    });
    return {
      deleted_web_presence_id: data.webPresenceDelete?.deletedId ?? id,
      redacted_fields: redactedFields,
    };
  },
});
