import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { edenApiCall } from '../common/client';
import { edenAuth } from '../common/auth';

export const invoiceParserAction = createAction({
  name: 'edenai-invoice-parser',
  auth: edenAuth,
  displayName: 'Invoice Parser',
  description:
    'Extract structured data from invoice documents using various OCR providers via Eden AI.',
  props: {
    file: Property.File({
      displayName: 'Invoice File',
      description: 'The invoice file to parse (PDF, image formats supported).',
      required: false,
    }),
    file_url: Property.ShortText({
      displayName: 'File URL',
      description:
        'URL of the invoice file to parse (alternative to file upload).',
      required: false,
    }),
    providers: Property.Array({
      displayName: 'Providers',
      description:
        'One or more providers (e.g., ["google", "microsoft"]) or providers with model (e.g., ["google/document-ai-v1"])',
      required: true,
    }),
    language: Property.ShortText({
      displayName: 'Language',
      description: 'Language code of the document (e.g., "en", "fr", "es").',
      required: false,
    }),
    fallback_providers: Property.Array({
      displayName: 'Fallback Providers',
      description:
        'Optional list of up to 5 fallback providers, used if the primary one fails.',
      required: false,
    }),
    response_as_dict: Property.Checkbox({
      displayName: 'Response as Dictionary',
      description:
        'If enabled, groups responses under provider keys. If disabled, returns a list of results.',
      defaultValue: true,
      required: false,
    }),
    attributes_as_list: Property.Checkbox({
      displayName: 'Attributes as List',
      description:
        'If enabled, returns each attribute as a list instead of list of objects.',
      defaultValue: false,
      required: false,
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Show Original Response',
      description:
        'Whether to include the original response from the provider.',
      defaultValue: false,
      required: false,
    }),
  },
  async run(context) {
    const {
      file,
      file_url,
      providers,
      language,
      fallback_providers,
      response_as_dict,
      attributes_as_list,
      show_original_response,
    } = context.propsValue;

    let body: any = {
      providers,
      language,
      fallback_providers,
      response_as_dict,
      attributes_as_list,
      show_original_response,
    };

    // Handle file upload vs URL
    if (file) {
      // For file uploads, we need to use the file directly
      const fileBuffer = Buffer.from(file.base64, 'base64');
      body.file = fileBuffer;
    } else if (file_url) {
      body.file_url = file_url;
    } else {
      throw new Error('Either file or file_url must be provided');
    }

    try {
      const response = await edenApiCall<any>({
        method: HttpMethod.POST,
        auth: { apiKey: context.auth },
        resourceUri: '/ocr/invoice_parser',
        body,
      });

      return {
        success: true,
        message: 'Invoice parsing completed successfully',
        data: response,
      };
    } catch (error: any) {
      if (error.message && error.message.includes('400')) {
        throw new Error(
          'Invalid request parameters. Please check your file or URL and try again.'
        );
      }
      if (
        error.message &&
        (error.message.includes('401') || error.message.includes('403'))
      ) {
        throw new Error(
          'Authentication failed. Please check your API key and permissions.'
        );
      }
      if (error.message && error.message.includes('404')) {
        throw new Error(
          'Resource not found. Please check the file or URL and try again.'
        );
      }
      if (error.message && error.message.includes('429')) {
        throw new Error(
          'Rate limit exceeded. Please wait a moment before trying again.'
        );
      }
      throw new Error(`Failed to parse invoice: ${error.message}`);
    }
  },
});
