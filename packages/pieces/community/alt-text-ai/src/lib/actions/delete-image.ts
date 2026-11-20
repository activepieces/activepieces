import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { altTextAiAuth } from '../common/auth';
import { altTextAiRequest, requireAssetId } from '../common/client';
import { altTextAiOutputSchemas } from '../common/schemas';

export const deleteImageAction = createAction({
  name: 'delete-image',
  auth: altTextAiAuth,
  displayName: 'Delete Image',
  description: 'Permanently deletes an image and its alt text from your AltText.ai library.',
  classification: 'DESTRUCTIVE',
  audience: 'both',
  aiMetadata: {
    description:
      'Permanently removes one image and all of its generated alt text from the AltText.ai library, by asset ID. This cannot be undone and the credit spent on generation is not refunded. Get asset IDs from List Images or Search Images. Not idempotent: deleting the same asset ID again fails with 404.',
    idempotent: false,
  },
  outputSchema: altTextAiOutputSchemas.deleted,
  props: {
    assetId: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The asset ID of the image to delete.',
      required: true,
    }),
  },
  async run(context) {
    const assetId = requireAssetId(context.propsValue.assetId);
    await altTextAiRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.DELETE,
      path: `/images/${encodeURIComponent(assetId)}`,
      operation: 'Delete Image',
    });
    return { deleted: true, asset_id: assetId };
  },
});
