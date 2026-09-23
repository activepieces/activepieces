import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlTheme,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
} from '../../common/graphql';

export const shopifyAiGetTheme = createAction({
  auth: shopifyAuth,
  name: 'get_theme',
  classification: 'READ',
  displayName: 'Get Theme',
  description: 'Get one theme with its role and processing state.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns one theme: name, role (MAIN is the live theme), whether it is still processing or failed to process, its Theme Store id and dates. Check the role before changing a theme or its files. Needs the read_themes access scope. Read-only.',
    idempotent: true,
  },
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
      theme: GqlTheme | null;
    }>({
      auth,
      query: `query GetTheme($id: ID!) { theme(id: $id) { ${shopifyFields.THEME_FIELDS} } }`,
      variables: { id },
    });
    if (!data.theme) {
      throw new Error(`Theme ${id} was not found.`);
    }
    return {
      ...shopifyMappers.mapTheme(data.theme),
      redacted_fields: redactedFields,
    };
  },
});
