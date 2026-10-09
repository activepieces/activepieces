import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlThemeFile,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { getThemeFileOutputSchema } from '../../output-schemas/content';

export const shopifyAiGetThemeFile = createAction({
  auth: shopifyAuth,
  name: 'get_theme_file',
  classification: 'READ',
  displayName: 'Get Theme File',
  description: 'Read one file (template, section, snippet, asset) of a theme.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Reads one file of a theme by its path, for example "templates/index.json", "sections/header.liquid", "snippets/price.liquid", "config/settings_data.json" or "assets/base.css"; use list_theme_files to find the exact paths. Text files return content; binary files return content_base64 or a url (body_type says which). Returns size, checksum_md5 and dates too. Fails when the file does not exist. Needs the read_themes access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: getThemeFileOutputSchema,
  props: {
    theme_id: Property.ShortText({
      displayName: 'Theme ID',
      description: 'The theme id, numeric or "gid://shopify/OnlineStoreTheme/…". Find it with list_themes (role MAIN is the live theme).',
      required: true,
    }),
    filename: Property.ShortText({
      displayName: 'File Path',
      description: 'Path of the file inside the theme, for example "templates/index.json" or "sections/header.liquid". Find it with list_theme_files.',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const filename = shopifyValues.nonEmpty(propsValue.filename);
    if (!filename) {
      throw new Error('A file path is required, for example "templates/index.json".');
    }
    const id = shopifyGraphqlClient.toGid({ type: 'OnlineStoreTheme', id: propsValue.theme_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      theme: {
        id: string;
        name?: string | null;
        role?: string | null;
        files?: {
          nodes?: GqlThemeFile[] | null;
          userErrors?: { filename?: string | null; code?: string | null }[] | null;
        } | null;
      } | null;
    }>({
      auth,
      query: `query GetThemeFile($id: ID!, $filenames: [String!]) { theme(id: $id) { id name role files(filenames: $filenames, first: 1) { nodes { ${shopifyFields.THEME_FILE_FIELDS} } userErrors { filename code } } } }`,
      variables: { id, filenames: [filename] },
      primaryPaths: ['theme.files'],
    });
    if (!data.theme) {
      throw new Error(`Theme ${id} was not found.`);
    }
    const file = (data.theme.files?.nodes ?? [])[0];
    if (!file) {
      const problem = (data.theme.files?.userErrors ?? [])[0];
      throw new Error(
        `File "${filename}" was not read from theme ${id}${problem?.code ? ` (${problem.code})` : ''}. Check the path, for example "templates/index.json".`
      );
    }
    return {
      theme_id: data.theme.id,
      theme_name: data.theme.name ?? null,
      theme_role: data.theme.role ?? null,
      ...shopifyMappers.mapThemeFile(file),
      redacted_fields: redactedFields,
    };
  },
});
