import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import { z } from 'zod';

const FINANCIAL_PARSER_PROVIDERS = [
  { label: 'Affinda', value: 'affinda' },
  { label: 'Amazon', value: 'amazon' },
  { label: 'Base64', value: 'base64' },
  { label: 'Google', value: 'google' },
  { label: 'Klippa', value: 'klippa' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'Mindee', value: 'mindee' },
  { label: 'Tabscanner', value: 'tabscanner' },
  { label: 'Veryfi', value: 'veryfi' },
  { label: 'EagleDoc', value: 'eagledoc' },
  { label: 'Extracta', value: 'extracta' },
  { label: 'OpenAI', value: 'openai' },
];

const FINANCIAL_PARSER_LANGUAGES = [
  { label: 'Auto Detection', value: 'auto-detect' },
  { label: 'Afrikaans', value: 'af' },
  { label: 'Albanian', value: 'sq' },
  { label: 'Amharic', value: 'am' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Armenian', value: 'hy' },
  { label: 'Azerbaijani', value: 'az' },
  { label: 'Basque', value: 'eu' },
  { label: 'Belarusian', value: 'be' },
  { label: 'Bengali', value: 'bn' },
  { label: 'Bosnian', value: 'bs' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Burmese', value: 'my' },
  { label: 'Catalan', value: 'ca' },
  { label: 'Catalan (Spain)', value: 'ca-ES' },
  { label: 'Cebuano', value: 'ceb' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Chinese (China)', value: 'zh-CN' },
  { label: 'Chinese (Taiwan)', value: 'zh-TW' },
  { label: 'Corsican', value: 'co' },
  { label: 'Croatian', value: 'hr' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Danish (Denmark)', value: 'da-DK' },
  { label: 'Dutch', value: 'nl' },
  { label: 'Dutch (Netherlands)', value: 'nl-NL' },
  { label: 'English', value: 'en' },
  { label: 'English (United Kingdom)', value: 'en-GB' },
  { label: 'English (United States)', value: 'en-US' },
  { label: 'Esperanto', value: 'eo' },
  { label: 'Estonian', value: 'et' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
  { label: 'French (Canada)', value: 'fr-CA' },
  { label: 'French (France)', value: 'fr-FR' },
  { label: 'French (Switzerland)', value: 'fr-CH' },
  { label: 'Galician', value: 'gl' },
  { label: 'Georgian', value: 'ka' },
  { label: 'German', value: 'de' },
  { label: 'German (Germany)', value: 'de-DE' },
  { label: 'German (Switzerland)', value: 'de-CH' },
  { label: 'Modern Greek', value: 'el' },
  { label: 'Gujarati', value: 'gu' },
  { label: 'Haitian', value: 'ht' },
  { label: 'Hausa', value: 'ha' },
  { label: 'Hawaiian', value: 'haw' },
  { label: 'Hebrew', value: 'he' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Hmong', value: 'hmn' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Icelandic', value: 'is' },
  { label: 'Igbo', value: 'ig' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Irish', value: 'ga' },
  { label: 'Italian', value: 'it' },
  { label: 'Italian (Italy)', value: 'it-IT' },
  { label: 'Italian (Switzerland)', value: 'it-CH' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Javanese', value: 'jv' },
  { label: 'Kannada', value: 'kn' },
  { label: 'Kazakh', value: 'kk' },
  { label: 'Khmer', value: 'km' },
  { label: 'Kinyarwanda', value: 'rw' },
  { label: 'Kirghiz', value: 'ky' },
  { label: 'Korean', value: 'ko' },
  { label: 'Kurdish', value: 'ku' },
  { label: 'Lao', value: 'lo' },
  { label: 'Latin', value: 'la' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Lithuanian', value: 'lt' },
  { label: 'Luxembourgish', value: 'lb' },
  { label: 'Macedonian', value: 'mk' },
  { label: 'Malagasy', value: 'mg' },
  { label: 'Malay', value: 'ms' },
  { label: 'Malayalam', value: 'ml' },
  { label: 'Maltese', value: 'mt' },
  { label: 'Maori', value: 'mi' },
  { label: 'Marathi', value: 'mr' },
  { label: 'Mongolian', value: 'mn' },
  { label: 'Nepali', value: 'ne' },
  { label: 'Norwegian', value: 'no' },
  { label: 'Nyanja', value: 'ny' },
  { label: 'Oriya', value: 'or' },
  { label: 'Panjabi', value: 'pa' },
  { label: 'Persian', value: 'fa' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Portuguese (Portugal)', value: 'pt-PT' },
  { label: 'Pushto', value: 'ps' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Russian', value: 'ru' },
  { label: 'Samoan', value: 'sm' },
  { label: 'Scottish Gaelic', value: 'gd' },
  { label: 'Serbian', value: 'sr' },
  { label: 'Shona', value: 'sn' },
  { label: 'Sindhi', value: 'sd' },
  { label: 'Sinhala', value: 'si' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Somali', value: 'so' },
  { label: 'Southern Sotho', value: 'st' },
  { label: 'Spanish', value: 'es' },
  { label: 'Spanish (Spain)', value: 'es-ES' },
  { label: 'Sundanese', value: 'su' },
  { label: 'Swahili', value: 'sw' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Tagalog', value: 'tl' },
  { label: 'Tajik', value: 'tg' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Tatar', value: 'tt' },
  { label: 'Telugu', value: 'te' },
  { label: 'Thai', value: 'th' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Turkmen', value: 'tk' },
  { label: 'Uighur', value: 'ug' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Urdu', value: 'ur' },
  { label: 'Uzbek', value: 'uz' },
  { label: 'Vietnamese', value: 'vi' },
  { label: 'Welsh', value: 'cy' },
  { label: 'Western Frisian', value: 'fy' },
  { label: 'Xhosa', value: 'xh' },
  { label: 'Yiddish', value: 'yi' },
  { label: 'Yoruba', value: 'yo' },
  { label: 'Zulu', value: 'zu' },
];

const DOCUMENT_TYPES = [
  { label: 'Auto Detection', value: 'auto-detect' },
  { label: 'Invoice', value: 'invoice' },
  { label: 'Receipt', value: 'receipt' },
];

function normalizeFinancialParserResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, extracted_data: [], status: 'fail', raw: response };
  }

  return {
    provider,
    extracted_data: providerResult.extracted_data || [],
    status: providerResult.status || 'success',
    original_response: providerResult.original_response || null,
    raw: response,
  };
}

export const invoiceParserAction = createAction({
  name: 'invoice_parser',
  displayName: 'Invoice Parser',
  description: 'Extract structured invoice data from files using Eden AI. Supports multiple providers, languages, and document types.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use for financial document parsing.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(FINANCIAL_PARSER_PROVIDERS),
    }),
    file_url: Property.ShortText({
      displayName: 'File URL',
      description: 'Public URL to the financial document file (PDF, image, etc).',
      required: true,
    }),
    document_type: Property.Dropdown({
      displayName: 'Document Type',
      description: 'The type of financial document to parse.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(DOCUMENT_TYPES),
      defaultValue: 'invoice',
    }),
    language: Property.Dropdown({
      displayName: 'Document Language',
      description: 'The language of the document. Choose "Auto Detection" if unsure.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(FINANCIAL_PARSER_LANGUAGES),
      defaultValue: 'auto-detect',
    }),
    model: Property.ShortText({
      displayName: 'Specific Model',
      description: 'Specific model to use (e.g., gpt-4o, gpt-4o-mini, gpt-4-turbo). Leave empty for default.',
      required: false,
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
    fallback_providers: Property.MultiSelectDropdown({
      displayName: 'Fallback Providers',
      description: 'Alternative providers to try if the main provider fails (up to 5).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(FINANCIAL_PARSER_PROVIDERS),
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
      document_type: z.string().nullish(),
      language: z.string().nullish(),
      model: z.string().nullish(),
      file_password: z.string().nullish(),
      convert_to_pdf: z.boolean().nullish(),
      fallback_providers: z.array(z.string()).max(5).nullish(),
      show_original_response: z.boolean().nullish(),
    });

    const { 
      provider, 
      file_url, 
      document_type, 
      language, 
      model, 
      file_password, 
      convert_to_pdf, 
      fallback_providers, 
      show_original_response 
    } = propsValue;

    const body: Record<string, any> = {
      providers: provider,
      file_url,
    };

    if (document_type && document_type !== 'auto-detect') {
      body['document_type'] = document_type;
    } else {
      body['document_type'] = 'invoice';
    }
    
    if (language && language !== 'auto-detect') body['language'] = language;
    if (file_password) body['file_password'] = file_password;
    if (convert_to_pdf) body['convert_to_pdf'] = convert_to_pdf;
    if (show_original_response) body['show_original_response'] = true;
    
    if (fallback_providers && fallback_providers.length > 0) {
      body['fallback_providers'] = fallback_providers.slice(0, 5);
    }

    if (model) {
      body['settings'] = { [provider]: model };
    }

    try {
      const response = await edenAiApiCall({
        apiKey: auth as string,
        method: HttpMethod.POST,
        resourceUri: '/ocr/financial_parser',
        body,
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeFinancialParserResponse(provider, response);
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
      throw new Error(`Failed to extract financial document data: ${err.message || err}`);
    }
  },
}); 