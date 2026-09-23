import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import {
  GqlJob,
  GqlThemeFileResult,
  shopifyFields,
  shopifyGraphqlClient,
  shopifyMappers,
  shopifyValues,
} from '../../common/graphql';

export const shopifyAiUpsertThemeFiles = createAction({
  auth: shopifyAuth,
  name: 'upsert_theme_files',
  classification: 'WRITE',
  displayName: 'Create or Update Theme Files',
  description: 'Create theme files or overwrite existing ones (up to 50 per call).',
  audience: 'ai',
  aiMetadata: {
    description:
      'Writes up to 50 files into one theme: a file that does not exist is created, and a file with the same path is overwritten completely (its previous content is not returned, so read it first with get_theme_file if you may need it). Writing to the live theme (role MAIN, see get_theme) changes the storefront immediately; say so before doing it, and prefer an unpublished copy. Returns the written files and, when Shopify finishes the write in the background, a job_id to poll with get_job. Sending the same files again leaves the same content. Shopify documents that modifying theme files needs the write_themes access scope AND an exemption granted by Shopify; without the exemption the call is refused with an access error, so report that instead of retrying.',
    idempotent: true,
  },
  props: {
    theme_id: Property.ShortText({
      displayName: 'Theme ID',
      description: 'The theme id, numeric or "gid://shopify/OnlineStoreTheme/…". Find it with list_themes.',
      required: true,
    }),
    files: Property.Array({
      displayName: 'Files',
      description: 'One entry per file, 1 to 50, each path at most once.',
      required: true,
      properties: {
        filename: Property.ShortText({
          displayName: 'File Path',
          description: 'Path inside the theme, for example "templates/index.json" or "snippets/promo-banner.liquid".',
          required: true,
        }),
        body_type: Property.StaticDropdown({
          displayName: 'Content Type',
          description: 'TEXT for text files (Liquid, JSON, CSS, JS), BASE64 for binary content, URL to copy a file from a public URL.',
          required: true,
          options: {
            options: [
              { label: 'Text', value: 'TEXT' },
              { label: 'Base64', value: 'BASE64' },
              { label: 'URL', value: 'URL' },
            ],
          },
        }),
        value: Property.LongText({
          displayName: 'Content',
          description: 'The full file content (TEXT), the base64 string (BASE64) or the public file URL (URL).',
          required: true,
        }),
      },
    }),
  },
  async run({ auth, propsValue }) {
    const files = buildFiles(propsValue.files);
    const themeId = shopifyGraphqlClient.toGid({ type: 'OnlineStoreTheme', id: propsValue.theme_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      themeFilesUpsert: {
        job?: GqlJob | null;
        upsertedThemeFiles?: GqlThemeFileResult[] | null;
      } | null;
    }>({
      auth,
      query: `mutation UpsertThemeFiles($themeId: ID!, $files: [OnlineStoreThemeFilesUpsertFileInput!]!) { themeFilesUpsert(themeId: $themeId, files: $files) { job { id done } upsertedThemeFiles { ${shopifyFields.THEME_FILE_RESULT_FIELDS} } userErrors { field message code filename } } }`,
      variables: { themeId, files },
    });
    const upserted = (data.themeFilesUpsert?.upsertedThemeFiles ?? []).map(shopifyMappers.mapThemeFileResult);
    return {
      theme_id: themeId,
      files: upserted,
      count: upserted.length,
      job_id: data.themeFilesUpsert?.job?.id ?? null,
      job_done: data.themeFilesUpsert?.job?.done ?? null,
      redacted_fields: redactedFields,
    };
  },
});

function buildFiles(value: unknown): { filename: string; body: { type: string; value: string } }[] {
  const rows = shopifyValues.readRecords(value);
  if (rows.length === 0) {
    throw new Error('Provide at least one file. Nothing was changed.');
  }
  if (rows.length > shopifyFields.MAX_THEME_FILES_PER_CALL) {
    throw new Error(
      `At most ${shopifyFields.MAX_THEME_FILES_PER_CALL} files per call; split the files over several calls. Nothing was changed.`
    );
  }
  const files = rows.map((row, index) => {
    const filename = shopifyValues.readText(row['filename']);
    const type = shopifyValues.readText(row['body_type']);
    const content = typeof row['value'] === 'string' ? row['value'] : undefined;
    if (!filename || content === undefined) {
      throw new Error(`files[${index}] needs a filename and a value. Nothing was changed.`);
    }
    if (!type || !BODY_TYPES.includes(type)) {
      throw new Error(`files[${index}].body_type must be TEXT, BASE64 or URL. Nothing was changed.`);
    }
    return { filename, body: { type, value: content } };
  });
  const names = files.map((file) => file.filename);
  const duplicate = names.find((name, index) => names.indexOf(name) !== index);
  if (duplicate) {
    throw new Error(`File "${duplicate}" is listed more than once; send each path once. Nothing was changed.`);
  }
  return files;
}

const BODY_TYPES = ['TEXT', 'BASE64', 'URL'];
