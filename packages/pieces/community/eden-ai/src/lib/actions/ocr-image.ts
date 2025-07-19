import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import {
  createStaticDropdown,
  OCR_EXTRACTION_STATIC_PROVIDERS,
  normalizeOcrExtraction,
} from '../common/providers';

export const ocrImageAction = createAction({
  name: 'ocr_image',
  displayName: 'Extract Text in Image (OCR)',
  description: 'Extract text from images (OCR) using Eden AI.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(OCR_EXTRACTION_STATIC_PROVIDERS),
    }),
    file_url: Property.ShortText({
      displayName: 'File URL',
      description: 'Public URL to the image file.',
      required: true,
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description: 'List of fallback providers to use if the main provider fails.',
      required: false,
      defaultValue: [],
    }),
  },
  async run({ auth, propsValue }) {
    const { provider, file_url, fallback_providers } = propsValue;
    if (!provider || typeof provider !== 'string' || provider.trim().length === 0) {
      throw new Error('Provider is required and must be a non-empty string.');
    }
    if (!file_url || typeof file_url !== 'string' || file_url.trim().length === 0) {
      throw new Error('File URL is required and must be a non-empty string.');
    }
    if (fallback_providers && !Array.isArray(fallback_providers)) {
      throw new Error('Fallback providers must be an array of provider names.');
    }
    const body: Record<string, any> = {
      providers: provider,
      file_url,
      fallback_providers: fallback_providers || [],
    };
    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/ocr/ocr',
        body,
      });
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }
      return normalizeOcrExtraction(provider, response);
    } catch (err: any) {
      if (err.response && err.response.body && err.response.body.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      throw new Error(`Failed to extract text from image: ${err.message || err}`);
    }
  },
}); 