import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown, normalizeProviderItems } from '../common/providers';

const RECEIPT_PARSER_STATIC_PROVIDERS = [
  { label: 'Mindee', value: 'mindee' },
  { label: 'Veryfi', value: 'veryfi' },
  { label: 'Base64', value: 'base64' },
  { label: 'Extracta', value: 'extracta' },
];

function normalizeReceipt(provider: string, response: any) {
  return normalizeProviderItems(provider, response, (item, provider) => ({
    merchant: item.merchant_name || item.merchant || '',
    date: item.date || '',
    total: item.total || item.amount || '',
    currency: item.currency || '',
    line_items: item.line_items || item.items || [],
    taxes: item.taxes || [],
    raw: item,
    provider: item.provider || provider,
  }));
}

export const receiptParserAction = createAction({
  name: 'receipt_parser',
  displayName: 'Receipt Parser',
  description: 'Extract data from receipts using Eden AI.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(RECEIPT_PARSER_STATIC_PROVIDERS),
    }),
    file_url: Property.ShortText({
      displayName: 'File URL',
      description: 'Public URL to the receipt file (PDF, image, etc).',
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
        resourceUri: '/ocr/data_extraction',
        body,
      });
      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }
      return normalizeReceipt(provider, response);
    } catch (err: any) {
      if (err.response && err.response.body && err.response.body.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      throw new Error(`Failed to extract receipt data: ${err.message || err}`);
    }
  },
}); 