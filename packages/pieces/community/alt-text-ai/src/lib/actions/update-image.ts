import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { altTextAiAuth } from '../common/auth';
import { altTextAiRequest, normalizeImage, requireAssetId } from '../common/client';
import { altTextAiOutputSchemas } from '../common/schemas';

export const updateImageAction = createAction({
  name: 'update-image',
  auth: altTextAiAuth,
  displayName: 'Update Image Alt Text',
  description:
    'Replaces the alt text stored for an image, without generating new text. Changes the main alt text only; per-language generated texts are not changed.',
  classification: 'WRITE',
  audience: 'both',
  aiMetadata: {
    description:
      'Overwrites the main alt text (alt_text) of an existing AltText.ai image, by asset ID, with text you provide. Update changes the main alt text only; per-language generated texts in alt_texts are not changed. Use to correct or hand-edit generated alt text; no credit is spent. Setting the same text again leaves the same state, so it is idempotent.',
    idempotent: true,
  },
  outputSchema: altTextAiOutputSchemas.image,
  props: {
    assetId: Property.ShortText({
      displayName: 'Asset ID',
      description: 'The asset ID of the image to update.',
      required: true,
    }),
    altText: Property.LongText({
      displayName: 'Alt Text',
      description: 'The new alt text.',
      required: true,
    }),
    lang: Property.ShortText({
      displayName: 'Language',
      description: 'Optional language code(s) passed to AltText.ai (for example "en"). Update changes the main alt text only; per-language generated texts in alt_texts are not changed.',
      required: false,
    }),
  },
  async run(context) {
    const assetId = requireAssetId(context.propsValue.assetId);
    const altText = context.propsValue.altText.trim();
    if (altText === '') {
      throw new Error('Alt Text cannot be empty.');
    }
    const lang = context.propsValue.lang
      ?.split(',')
      .map((code) => code.trim())
      .filter((code) => code !== '')
      .join(',');
    const queryParams: Record<string, string> = { overwrite: 'true' };
    if (lang) queryParams['lang'] = lang;
    const response = await altTextAiRequest({
      apiKey: context.auth.secret_text,
      method: HttpMethod.PUT,
      path: `/images/${encodeURIComponent(assetId)}`,
      operation: 'Update Image Alt Text',
      body: { image: { alt_text: altText } },
      queryParams,
    });
    return normalizeImage(response);
  },
});
