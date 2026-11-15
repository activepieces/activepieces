import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { altTextAiAuth } from '../common/auth';
import { altTextAiRequest, normalizeImage, requireAssetId } from '../common/client';
import { altTextAiOutputSchemas } from '../common/schemas';

export const getImageAction = createAction({
  name: 'get-image',
  auth: altTextAiAuth,
  displayName: 'Get Image',
  description: 'Retrieves an image and its generated alt text by asset ID.',
  classification: 'READ',
  audience: 'both',
  aiMetadata: {
    description:
      'Fetches one AltText.ai image record (URL, alt text in each language, tags, created date) by its asset ID. Use to read alt text that was already generated without spending a credit. Get asset IDs from Generate Alt Text, List Images or Search Images. Read-only and idempotent.',
    idempotent: true,
  },
  outputSchema: altTextAiOutputSchemas.image,
  props: {
    assetId: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The asset ID of the image, as returned by Generate Alt Text or List Images.',
      required: true,
    }),
  },
  async run(context) {
    const assetId = requireAssetId(context.propsValue.assetId);
    const body = await altTextAiRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.GET,
      path: `/images/${encodeURIComponent(assetId)}`,
      operation: 'Get Image',
    });
    return normalizeImage(body);
  },
});
