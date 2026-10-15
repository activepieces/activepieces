import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlTheme,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';
import { themeOutputSchema } from '../../output-schemas/content';

export const shopifyAiPublishTheme = createAction({
  auth: shopifyAuth,
  name: 'publish_theme',
  classification: 'WRITE',
  displayName: 'Publish Theme',
  description: 'Make a theme the live theme of the online store.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Publishes one theme as the live theme (role MAIN): it replaces the storefront every shopper sees immediately, and the theme that was live stops being live. Before calling, run list_themes with role MAIN and note the current live theme\'s id and name, because publishing that theme again is the only way back; then tell the user which theme goes live and which one it replaces, and only continue once they agree. The theme should have finished processing (processing false, see get_theme). Returns the published theme with its role. Publishing the theme that is already live should leave the same state, which is still to be confirmed on a store. Shopify documents that modifying themes needs the write_themes access scope AND an exemption granted by Shopify; without the exemption the call is refused with an access error, so report that instead of retrying.',
    idempotent: true,
  },
  outputSchema: themeOutputSchema,
  props: {
    theme_id: Property.ShortText({
      displayName: 'Theme ID',
      description: 'The theme to make live, numeric or "gid://shopify/OnlineStoreTheme/…". Find it with list_themes.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'OnlineStoreTheme', id: propsValue.theme_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      themePublish: { theme: GqlTheme | null } | null;
    }>({
      auth,
      query: `mutation PublishTheme($id: ID!) { themePublish(id: $id) { theme { ${shopifyFields.THEME_FIELDS} } userErrors { field message code } } }`,
      variables: { id },
    });
    const theme = data.themePublish?.theme;
    if (!theme) {
      throw new Error('Shopify did not return the published theme.');
    }
    return {
      ...shopifyMappers.mapTheme(theme),
      redacted_fields: redactedFields,
    };
  },
});
