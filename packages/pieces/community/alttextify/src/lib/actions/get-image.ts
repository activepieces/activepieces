import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { alttextifyAuth } from '../common/auth';
import { alttextifyApi, AlttextifyImage, normalizeImage } from '../common/client';
import { alttextifySchemas } from '../common/schemas';

export const getImageAction = createAction({
  name: 'get-image',
  classification: 'READ',
  auth: alttextifyAuth,
  displayName: 'Get Alt Text',
  description: 'Gets the stored alt text of an image by its asset ID. Deleted images can still be returned.',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one stored AltTextify image record by asset_id and returns its alt text (alt_text as one string, alt_texts as the full list), image_source, tag, created_at and status (DELETED for deleted records when AltTextify reports it; deleted records can still be returned). Read-only; does not use credits. Use the asset_id returned by Generate Image Alt Text or List Images.',
    idempotent: true,
  },
  props: {
    asset_id: Property.ShortText({
      displayName: 'Asset ID',
      description: 'ID of the image record, as returned by Generate Image Alt Text.',
      required: true,
    }),
  },
  outputSchema: alttextifySchemas.image,
  async run(context) {
    const assetId = context.propsValue.asset_id.trim();
    if (!assetId) {
      throw new Error('Asset ID is required.');
    }
    const image = await alttextifyApi.request<AlttextifyImage>({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/image/${encodeURIComponent(assetId)}`,
      operation: 'get image',
    });
    return normalizeImage(image);
  },
});
