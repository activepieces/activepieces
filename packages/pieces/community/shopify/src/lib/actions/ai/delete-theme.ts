import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient } from '../../common/graphql';
import { deleteThemeOutputSchema } from '../../output-schemas/content';

export const shopifyAiDeleteTheme = createAction({
  auth: shopifyAuth,
  name: 'delete_theme',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Theme',
  description: 'Permanently delete an unpublished theme.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes one theme with all its files and customizations. Shopify may refuse to delete the live (MAIN) theme (not yet confirmed on a store), so never try it: check the role with get_theme first. Cannot be undone; a repeat call fails because the theme is gone. Shopify documents that modifying themes needs the write_themes access scope AND an exemption granted by Shopify; without the exemption the call is refused with an access error, so report that instead of retrying.',
    idempotent: false,
  },
  outputSchema: deleteThemeOutputSchema,
  props: {
    theme_id: Property.ShortText({
      displayName: 'Theme ID',
      description: 'The theme id, numeric or "gid://shopify/OnlineStoreTheme/…". Find it with list_themes.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const id = shopifyGraphqlClient.toGid({ type: 'OnlineStoreTheme', id: propsValue.theme_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      themeDelete: { deletedThemeId?: string | null } | null;
    }>({
      auth,
      query: `mutation DeleteTheme($id: ID!) { themeDelete(id: $id) { deletedThemeId userErrors { field message code } } }`,
      variables: { id },
    });
    return {
      deleted_theme_id: data.themeDelete?.deletedThemeId ?? id,
      redacted_fields: redactedFields,
    };
  },
});
