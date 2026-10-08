import { createAction, Property } from '@activepieces/pieces-framework';
import { shopifyAuth } from '../../..';
import { shopifyGraphqlClient, shopifyValues } from '../../common/graphql';
import { updateProductMediaOutputSchema } from '../../output-schemas/products';

export const shopifyAiUpdateProductMedia = createAction({
  auth: shopifyAuth,
  name: 'update_product_media',
  classification: 'WRITE',
  displayName: 'Update Product Media',
  description: 'Change the alt text, filename or image of an existing media file.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Changes one existing media file: its alt text, its filename (the extension must stay the same) or, for images, replaces the file content from a public URL while keeping the same media id. Fields left empty keep their values. The file must be in READY state. Needs the write_files (or write_themes) access scope. Re-running with the same values is safe.',
    idempotent: true,
  },
  outputSchema: updateProductMediaOutputSchema,
  props: {
    media_id: Property.ShortText({
      displayName: 'Media ID',
      description: 'The media id, for example "gid://shopify/MediaImage/1072273219". Find it with list_product_media.',
      required: true,
    }),
    alt: Property.ShortText({
      displayName: 'Alt Text',
      description: 'New accessible description, for example "Red t-shirt, back view".',
      required: false,
    }),
    filename: Property.ShortText({
      displayName: 'Filename',
      description: 'New filename with the same extension, for example "red-shirt-back.jpg".',
      required: false,
    }),
    replacement_url: Property.ShortText({
      displayName: 'Replacement Image URL',
      description: 'Public URL of a new image that replaces the file content, for example "https://example.com/new.jpg". Images only.',
      required: false,
    }),
  },
  async run({ auth, propsValue }) {
    const patch = shopifyValues.compact({
      alt: shopifyValues.nonEmpty(propsValue.alt),
      filename: shopifyValues.nonEmpty(propsValue.filename),
      originalSource: shopifyValues.nonEmpty(propsValue.replacement_url),
    });
    if (Object.keys(patch).length === 0) {
      throw new Error('Provide at least one field to update.');
    }
    const id = shopifyGraphqlClient.toGid({ type: 'MediaImage', id: propsValue.media_id });
    const { data, redactedFields } = await shopifyGraphqlClient.request<{
      fileUpdate: {
        files:
          | {
              id?: string | null;
              alt?: string | null;
              fileStatus?: string | null;
              updatedAt?: string | null;
              image?: { url?: string | null } | null;
              preview?: { image?: { url?: string | null } | null } | null;
            }[]
          | null;
      } | null;
    }>({
      auth,
      query: `mutation UpdateProductMedia($files: [FileUpdateInput!]!) { fileUpdate(files: $files) { files { id alt fileStatus updatedAt preview { image { url } } ... on MediaImage { image { url } } } userErrors { field message code } } }`,
      variables: { files: [{ id, ...patch }] },
    });
    const file = data.fileUpdate?.files?.[0];
    return {
      id: file?.id ?? id,
      alt: file?.alt ?? null,
      file_status: file?.fileStatus ?? null,
      image_url: file?.image?.url ?? null,
      preview_url: file?.preview?.image?.url ?? null,
      updated_at: file?.updatedAt ?? null,
      redacted_fields: redactedFields,
    };
  },
});
