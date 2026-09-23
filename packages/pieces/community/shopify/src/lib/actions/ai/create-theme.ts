import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlTheme,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiCreateTheme = createAction({
  auth: shopifyAuth,
  name: 'create_theme',
  classification: 'WRITE',
  displayName: 'Create Theme',
  description: 'Import a theme from a ZIP file URL as an unpublished theme.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Imports a theme from a public ZIP file URL and returns it. The new theme is never live: its role is UNPUBLISHED (default) or DEVELOPMENT, and it is processed in the background (processing is true until get_theme shows it finished). A store holds at most 20 themes. Each call creates another theme. Shopify documents that modifying themes needs the write_themes access scope AND an exemption granted by Shopify; without the exemption the call is refused with an access error, so report that instead of retrying.',
    idempotent: false,
  },
  props: {
    source: Property.ShortText({
      displayName: 'Theme ZIP URL',
      description: 'Public URL of the theme ZIP file, for example "https://example.com/themes/my-theme.zip".',
      required: true,
    }),
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Name for the new theme, for example "Autumn 2026". Leave empty to use the name in the ZIP.',
      required: false,
    }),
    role: Property.StaticDropdown({
      displayName: 'Role',
      description: 'UNPUBLISHED (default) or DEVELOPMENT for a temporary theme. A theme can never be created live.',
      required: false,
      options: {
        options: [
          { label: 'Unpublished', value: 'UNPUBLISHED' },
          { label: 'Development', value: 'DEVELOPMENT' },
        ],
      },
    }),
  },
  async run({ auth, propsValue }) {
    const source = shopifyValues.nonEmpty(propsValue.source);
    if (!source || !/^https?:\/\//i.test(source)) {
      throw new Error('source must be a public http(s) URL of a theme ZIP file. Nothing was created.');
    }
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      themeCreate: { theme: GqlTheme | null } | null;
    }>({
      auth,
      query: `mutation CreateTheme($source: URL!, $name: String, $role: ThemeRole) { themeCreate(source: $source, name: $name, role: $role) { theme { ${shopifyFields.THEME_FIELDS} } userErrors { field message code } } }`,
      variables: {
        source,
        name: shopifyValues.nonEmpty(propsValue.name),
        role: propsValue.role ?? 'UNPUBLISHED',
      },
    });
    const theme = data.themeCreate?.theme;
    if (!theme) {
      throw new Error('Shopify did not return the created theme.');
    }
    return {
      ...shopifyMappers.mapTheme(theme),
      redacted_fields: redactedFields,
    };
  },
});
