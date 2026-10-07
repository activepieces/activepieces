import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlConnection,
  GqlThemeFileSummary,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyProps,
  shopifyValues,
} from '../../common/graphql';
import { listThemeFilesOutputSchema } from '../../output-schemas/content';

const MAX_PAGE_SIZE = 250;

export const shopifyAiListThemeFiles = createAction({
  auth: shopifyAuth,
  name: 'list_theme_files',
  classification: 'SEARCH',
  displayName: 'List Theme Files',
  description: 'List the file paths of a theme, optionally filtered by path pattern.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Lists the files of one theme without their content: path (filename), content_type, size, checksum_md5 and dates. Use it to find the path to pass to get_theme_file, upsert_theme_files or delete_theme_files. Optional filenames narrows the list to up to 50 paths or patterns, where * matches any characters (for example "templates/*.json" or "sections/*"). Paged: pass end_cursor back as the cursor while has_next_page is true; Shopify may return fewer files than the page size to stay within its payload limit, so rely on has_next_page rather than the count. Any per-path problem Shopify reports (for example NOT_FOUND) comes back in file_errors with the filename and code. Needs the read_themes access scope. Read-only.',
    idempotent: true,
  },
  outputSchema: listThemeFilesOutputSchema,
  props: {
    theme_id: Property.ShortText({
      displayName: 'Theme ID',
      description: 'The theme id, numeric or "gid://shopify/OnlineStoreTheme/…". Find it with list_themes (role MAIN is the live theme).',
      required: true,
    }),
    filenames: Property.Array({
      displayName: 'File Paths or Patterns',
      description: 'Only list these paths, up to 50; * matches any characters, for example ["templates/*.json", "layout/theme.liquid"]. Leave empty for every file.',
      required: false,
    }),
    first: shopifyProps.first({ max: MAX_PAGE_SIZE }),
    after: shopifyProps.after(),
  },
  async run({ auth, propsValue }) {
    const filenames = [...new Set(shopifyValues.readStringList(propsValue.filenames) ?? [])];
    if (filenames.length > shopifyFields.MAX_THEME_FILES_PER_CALL) {
      throw new Error(
        `At most ${shopifyFields.MAX_THEME_FILES_PER_CALL} paths or patterns per call; use a pattern such as "sections/*" or split them over several calls.`
      );
    }
    const first = shopifyValues.readFirst({ value: propsValue.first, max: MAX_PAGE_SIZE });
    const id = shopifyGraphqlClient.toGid({ type: 'OnlineStoreTheme', id: propsValue.theme_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      theme: {
        id: string;
        name?: string | null;
        role?: string | null;
        files?: (GqlConnection<GqlThemeFileSummary> & {
          userErrors?: { filename?: string | null; code?: string | null }[] | null;
        }) | null;
      } | null;
    }>({
      auth,
      query: `query ListThemeFiles($id: ID!, $first: Int!, $after: String, $filenames: [String!]) { theme(id: $id) { id name role files(first: $first, after: $after, filenames: $filenames) { nodes { ${shopifyFields.THEME_FILE_SUMMARY_FIELDS} } ${shopifyFields.PAGE_INFO_FIELDS} userErrors { filename code } } } }`,
      variables: {
        id,
        first,
        after: shopifyValues.nonEmpty(propsValue.after),
        filenames: filenames.length > 0 ? filenames : undefined,
      },
      primaryPaths: ['theme.files'],
    });
    if (!data.theme) {
      throw new Error(`Theme ${id} was not found. Use list_themes to see the theme ids.`);
    }
    const page = shopifyMappers.toPage({
      connection: data.theme.files,
      map: shopifyMappers.mapThemeFileSummary,
      redactedFields,
    });
    return {
      theme_id: data.theme.id,
      theme_name: data.theme.name ?? null,
      theme_role: data.theme.role ?? null,
      ...page,
      file_errors: (data.theme.files?.userErrors ?? []).map((problem) => ({
        filename: problem.filename ?? null,
        code: problem.code ?? null,
      })),
    };
  },
});
