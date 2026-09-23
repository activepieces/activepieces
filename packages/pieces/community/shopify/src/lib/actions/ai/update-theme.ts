import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlTheme,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpdateTheme = createAction({
  auth: shopifyAuth,
  name: 'update_theme',
  classification: 'WRITE',
  displayName: 'Rename Theme',
  description: 'Rename a theme.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Renames one theme and returns it; the name is the only theme setting this action changes; to make a theme the live theme use publish_theme instead. Renaming to the same name again leaves the same state. Shopify documents that modifying themes needs the write_themes access scope AND an exemption granted by Shopify; without the exemption the call is refused with an access error, so report that instead of retrying.',
    idempotent: true,
  },
  props: {
    theme_id: Property.ShortText({
      displayName: 'Theme ID',
      description: 'The theme id, numeric or "gid://shopify/OnlineStoreTheme/…". Find it with list_themes.',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'New Name',
      description: 'The new theme name, for example "Dawn - holiday edit".',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const name = shopifyValues.nonEmpty(propsValue.name);
    if (!name) {
      throw new Error('A new theme name is required. Nothing was changed.');
    }
    const id = shopifyGraphqlClient.toGid({ type: 'OnlineStoreTheme', id: propsValue.theme_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      themeUpdate: { theme: GqlTheme | null } | null;
    }>({
      auth,
      query: `mutation UpdateTheme($id: ID!, $input: OnlineStoreThemeInput!) { themeUpdate(id: $id, input: $input) { theme { ${shopifyFields.THEME_FIELDS} } userErrors { field message code } } }`,
      variables: { id, input: { name } },
    });
    const theme = data.themeUpdate?.theme;
    if (!theme) {
      throw new Error('Shopify did not return the updated theme.');
    }
    return {
      ...shopifyMappers.mapTheme(theme),
      redacted_fields: redactedFields,
    };
  },
});
