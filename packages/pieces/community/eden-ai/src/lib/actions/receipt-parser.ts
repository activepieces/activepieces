import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import * as z from 'zod/mini'
import { edenAiAuth } from '../..';

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
  auth: edenAiAuth,
  name: 'receipt_parser',
  classification: 'READ',
  displayName: 'Parse Receipt',
  description: 'Extract fields from a receipt or other document at a public URL.',
  audience: 'both',
  aiMetadata: {
    description:
      'Extract structured fields from a document referenced by URL via Eden AI data-extraction (OCR) endpoint, routed to a chosen provider. Use it for general field extraction from receipts and similar documents; unlike the invoice parser this takes a public file URL rather than a file upload. Requires a provider and a valid file URL; optionally a password for protected PDFs. Read-only extraction with no side effect, so it is safe to repeat.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'document', display: 'section', label: 'Document', icon: 'file', props: ['file_url'] },
    { key: 'ai_model', display: 'section', label: 'AI Provider', icon: 'code', props: ['provider'] },
  ],
  props: {
    provider: Property.Dropdown({
      auth: edenAiAuth,
      displayName: 'Provider',
      description: 'The AI service that runs this step.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(DATA_EXTRACTION_PROVIDERS),
    }),
    file_url: Property.ShortText({
      displayName: 'File URL',
      description: 'Public link to the receipt or document.',
      placeholder: 'https://example.com/receipt.pdf',
      required: true,
    }),
    file_password: Property.ShortText({
      displayName: 'PDF Password',
      description: 'Only needed for password-protected PDFs.',
      advanced: true,
      required: false,
    }),
    convert_to_pdf: Property.Checkbox({
      displayName: 'Convert to PDF',
      description: 'Converts DOC or DOCX files to PDF before reading them.',
      advanced: true,
      required: false,
      defaultValue: false,
    }),
    attributes_as_list: Property.Checkbox({
      displayName: 'Attributes as List',
      description: 'Returns each field as a list instead of a list of objects.',
      advanced: true,
      required: false,
      defaultValue: false,
    }),
    fallback_providers: Property.MultiSelectDropdown({
      auth: edenAiAuth,
      displayName: 'Fallback Providers',
      description: 'Tried in order if the main provider fails. Up to 5.',
      advanced: true,
      required: false,
      refreshers: [],
      options: createStaticDropdown(DATA_EXTRACTION_PROVIDERS),
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Include Original Response',
      description: "Adds the provider's unprocessed response to the output.",
      advanced: true,
      required: false,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      provider: z.string().check(z.minLength(1, 'Provider is required')),
      file_url: z.string().check(z.url('Valid file URL is required')),
      file_password: z.nullish(z.string()),
      convert_to_pdf: z.nullish(z.boolean()),
      attributes_as_list: z.nullish(z.boolean()),
      fallback_providers: z.nullish(z.array(z.string()).check(z.maxLength(5))),
      show_original_response: z.nullish(z.boolean()),
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
        apiKey: auth.secret_text,
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