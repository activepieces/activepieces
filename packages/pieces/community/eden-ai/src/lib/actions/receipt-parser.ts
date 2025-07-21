import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import { z } from 'zod';

const DATA_EXTRACTION_PROVIDERS = [
  { label: 'Amazon', value: 'amazon' },
  { label: 'Base64', value: 'base64' },
];

function normalizeDataExtractionResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, fields: [], status: 'fail', raw: response };
  }

  return {
    provider,
    fields: providerResult.fields || [],
    confidence_score: providerResult.confidence_score || 0,
    status: providerResult.status || 'success',
    original_response: providerResult.original_response || null,
    raw: response,
  };
}

export const receiptParserAction = createAction({
  name: 'receipt_parser',
  displayName: 'Receipt Parser',
  description: 'Extract structured data from receipts and documents using Eden AI. Supports general data extraction with bounding boxes.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use for data extraction.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(DATA_EXTRACTION_PROVIDERS),
    }),
    file_url: Property.ShortText({
      displayName: 'File URL',
      description: 'Public URL to the document file (PDF, image, etc).',
      required: true,
    }),
    file_password: Property.ShortText({
      displayName: 'PDF Password',
      description: 'Password for protected PDF files (if applicable).',
      required: false,
    }),
    convert_to_pdf: Property.Checkbox({
      displayName: 'Convert to PDF',
      description: 'Convert DOC/DOCX files to PDF format for better compatibility.',
      required: false,
      defaultValue: false,
    }),
    attributes_as_list: Property.Checkbox({
      displayName: 'Attributes as List',
      description: 'Return extracted data with each attribute as a list instead of list of objects.',
      required: false,
      defaultValue: false,
    }),
    fallback_providers: Property.MultiSelectDropdown({
      displayName: 'Fallback Providers',
      description: 'Alternative providers to try if the main provider fails (up to 5).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(DATA_EXTRACTION_PROVIDERS),
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Include Original Response',
      description: 'Include the raw provider response in the output for debugging.',
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      provider: z.string().min(1, 'Provider is required'),
      file_url: z.string().url('Valid file URL is required'),
      file_password: z.string().nullish(),
      convert_to_pdf: z.boolean().nullish(),
      attributes_as_list: z.boolean().nullish(),
      fallback_providers: z.array(z.string()).max(5).nullish(),
      show_original_response: z.boolean().nullish(),
    });

    const { 
      provider, 
      file_url, 
      file_password, 
      convert_to_pdf, 
      attributes_as_list, 
      fallback_providers, 
      show_original_response 
    } = propsValue;

    const body: Record<string, any> = {
      providers: provider,
      file_url,
    };

    if (file_password) body['file_password'] = file_password;
    if (convert_to_pdf) body['convert_to_pdf'] = convert_to_pdf;
    if (attributes_as_list) body['attributes_as_list'] = attributes_as_list;
    if (show_original_response) body['show_original_response'] = true;
    
    if (fallback_providers && fallback_providers.length > 0) {
      body['fallback_providers'] = fallback_providers.slice(0, 5);
    }

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

      return normalizeDataExtractionResponse(provider, response);
    } catch (err: any) {
      if (err.response?.body?.error) {
        throw new Error(`Eden AI API error: ${err.response.body.error}`);
      }
      if (err.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      }
      if (err.response?.status === 401) {
        throw new Error('Invalid API key. Please check your Eden AI credentials.');
      }
      if (err.response?.status === 400) {
        throw new Error('Invalid request. Please check your file URL and parameters.');
      }
      throw new Error(`Failed to extract data from document: ${err.message || err}`);
    }
  },
}); 