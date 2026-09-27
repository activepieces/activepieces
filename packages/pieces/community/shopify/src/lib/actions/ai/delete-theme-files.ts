import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlThemeFileResult,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';
import { deleteThemeFilesOutputSchema } from '../../output-schemas/content';

export const shopifyAiDeleteThemeFiles = createAction({
  auth: shopifyAuth,
  name: 'delete_theme_files',
  classification: 'DESTRUCTIVE',
  displayName: 'Delete Theme Files',
  description: 'Permanently delete files from a theme (up to 50 per call).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Permanently deletes up to 50 files from one theme by path. Deleting a file that a template or section still uses breaks that part of the storefront, and on the live theme (role MAIN, see get_theme) the change is immediate; say so before doing it. Read a file with get_theme_file first if it may be needed again. Cannot be undone; a repeat call may fail for files that are already gone (not yet confirmed on a store). Shopify documents that modifying theme files needs the write_themes access scope AND an exemption granted by Shopify; without the exemption the call is refused with an access error, so report that instead of retrying.',
    idempotent: false,
  },
  outputSchema: deleteThemeFilesOutputSchema,
  props: {
    theme_id: Property.ShortText({
      displayName: 'Theme ID',
      description: 'The theme id, numeric or "gid://shopify/OnlineStoreTheme/…". Find it with list_themes.',
      required: true,
    }),
    filenames: Property.Array({
      displayName: 'File Paths',
      description: 'Paths of the files to delete, 1 to 50, for example ["snippets/old-banner.liquid"].',
      required: true,
    }),
  },
  async run({ auth, propsValue }) {
    const files = [...new Set(shopifyValues.readStringList(propsValue.filenames) ?? [])];
    if (files.length === 0) {
      throw new Error('Provide at least one file path. Nothing was deleted.');
    }
    if (files.length > shopifyFields.MAX_THEME_FILES_PER_CALL) {
      throw new Error(
        `At most ${shopifyFields.MAX_THEME_FILES_PER_CALL} files per call; split them over several calls. Nothing was deleted.`
      );
    }
    const themeId = shopifyGraphqlClient.toGid({ type: 'OnlineStoreTheme', id: propsValue.theme_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      themeFilesDelete: { deletedThemeFiles?: GqlThemeFileResult[] | null } | null;
    }>({
      auth,
      query: `mutation DeleteThemeFiles($themeId: ID!, $files: [String!]!) { themeFilesDelete(themeId: $themeId, files: $files) { deletedThemeFiles { ${shopifyFields.THEME_FILE_RESULT_FIELDS} } userErrors { field message code filename } } }`,
      variables: { themeId, files },
    });
    const deleted = (data.themeFilesDelete?.deletedThemeFiles ?? []).map(shopifyMappers.mapThemeFileResult);
    return {
      theme_id: themeId,
      deleted_files: deleted,
      count: deleted.length,
      redacted_fields: redactedFields,
    };
  },
});
