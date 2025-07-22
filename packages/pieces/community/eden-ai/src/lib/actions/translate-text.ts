import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import { z } from 'zod';

const TRANSLATION_PROVIDERS = [
  { label: 'Amazon', value: 'amazon' },
  { label: 'Google', value: 'google' },
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'DeepL', value: 'deepl' },
  { label: 'ModernMT', value: 'modernmt' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'XAI Grok', value: 'xai' },
];

const TRANSLATION_LANGUAGES = [
  { label: 'Auto Detection', value: 'auto-detect' },
  { label: 'Afrikaans', value: 'af' },
  { label: 'Albanian', value: 'sq' },
  { label: 'Amharic', value: 'am' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Armenian', value: 'hy' },
  { label: 'Assamese', value: 'as' },
  { label: 'Azerbaijani', value: 'az' },
  { label: 'Bashkir', value: 'ba' },
  { label: 'Basque', value: 'eu' },
  { label: 'Belarusian', value: 'be' },
  { label: 'Bengali', value: 'bn' },
  { label: 'Bosnian', value: 'bs' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Burmese', value: 'my' },
  { label: 'Catalan', value: 'ca' },
  { label: 'Cebuano', value: 'ceb' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Chinese (China)', value: 'zh-CN' },
  { label: 'Chinese (Simplified)', value: 'zh-Hans' },
  { label: 'Chinese (Taiwan)', value: 'zh-TW' },
  { label: 'Chinese (Traditional)', value: 'zh-Hant' },
  { label: 'Corsican', value: 'co' },
  { label: 'Croatian', value: 'hr' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Dari', value: 'prs' },
  { label: 'Dhivehi', value: 'dv' },
  { label: 'Dutch', value: 'nl' },
  { label: 'English', value: 'en' },
  { label: 'English (United Kingdom)', value: 'en-GB' },
  { label: 'English (United States)', value: 'en-US' },
  { label: 'Esperanto', value: 'eo' },
  { label: 'Estonian', value: 'et' },
  { label: 'Faroese', value: 'fo' },
  { label: 'Fijian', value: 'fj' },
  { label: 'Filipino', value: 'fil' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
  { label: 'French (Canada)', value: 'fr-CA' },
  { label: 'Galician', value: 'gl' },
  { label: 'Georgian', value: 'ka' },
  { label: 'German', value: 'de' },
  { label: 'Modern Greek', value: 'el' },
  { label: 'Gujarati', value: 'gu' },
  { label: 'Haitian', value: 'ht' },
  { label: 'Hausa', value: 'ha' },
  { label: 'Hawaiian', value: 'haw' },
  { label: 'Hebrew', value: 'he' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Hmong', value: 'hmn' },
  { label: 'Hmong Daw', value: 'mww' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Icelandic', value: 'is' },
  { label: 'Igbo', value: 'ig' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Inuinnaqtun', value: 'ikt' },
  { label: 'Inuktitut', value: 'iu' },
  { label: 'Inuktitut (Latin)', value: 'iu-Latn' },
  { label: 'Irish', value: 'ga' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Javanese', value: 'jv' },
  { label: 'Kannada', value: 'kn' },
  { label: 'Kazakh', value: 'kk' },
  { label: 'Khmer', value: 'km' },
  { label: 'Kinyarwanda', value: 'rw' },
  { label: 'Kirghiz', value: 'ky' },
  { label: 'Klingon', value: 'tlh' },
  { label: 'Klingon (Klingon)', value: 'tlh-Piqd' },
  { label: 'Klingon (Latin)', value: 'tlh-Latn' },
  { label: 'Korean', value: 'ko' },
  { label: 'Kurdish', value: 'ku' },
  { label: 'Northern Kurdish', value: 'kmr' },
  { label: 'Lao', value: 'lo' },
  { label: 'Latin', value: 'la' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Literary Chinese', value: 'lzh' },
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
  { label: 'Mongolian (Cyrillic)', value: 'mn-Cyrl' },
  { label: 'Mongolian (Mongolian)', value: 'mn-Mong' },
  { label: 'Nepali', value: 'ne' },
  { label: 'Norwegian', value: 'no' },
  { label: 'Norwegian Bokmål', value: 'nb' },
  { label: 'Norwegian Nynorsk', value: 'nn' },
  { label: 'Nyanja', value: 'ny' },
  { label: 'Oriya', value: 'or' },
  { label: 'Panjabi', value: 'pa' },
  { label: 'Persian', value: 'fa' },
  { label: 'Persian (Afghanistan)', value: 'fa-AF' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Portuguese (Brazil)', value: 'pt-BR' },
  { label: 'Portuguese (Portugal)', value: 'pt-PT' },
  { label: 'Pushto', value: 'ps' },
  { label: 'Querétaro Otomi', value: 'otq' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Russian', value: 'ru' },
  { label: 'Samoan', value: 'sm' },
  { label: 'Scottish Gaelic', value: 'gd' },
  { label: 'Serbian', value: 'sr' },
  { label: 'Serbian (Cyrillic)', value: 'sr-Cyrl' },
  { label: 'Serbian (Latin)', value: 'sr-Latn' },
  { label: 'Shona', value: 'sn' },
  { label: 'Sindhi', value: 'sd' },
  { label: 'Sinhala', value: 'si' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Somali', value: 'so' },
  { label: 'Southern Sotho', value: 'st' },
  { label: 'Spanish', value: 'es' },
  { label: 'Spanish (Latin America)', value: 'es-419' },
  { label: 'Spanish (Mexico)', value: 'es-MX' },
  { label: 'Spanish (Spain)', value: 'es-ES' },
  { label: 'Sundanese', value: 'su' },
  { label: 'Swahili', value: 'sw' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Tagalog', value: 'tl' },
  { label: 'Tahitian', value: 'ty' },
  { label: 'Tajik', value: 'tg' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Tatar', value: 'tt' },
  { label: 'Telugu', value: 'te' },
  { label: 'Thai', value: 'th' },
  { label: 'Tibetan', value: 'bo' },
  { label: 'Tigrinya', value: 'ti' },
  { label: 'Tonga', value: 'to' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Turkmen', value: 'tk' },
  { label: 'Uighur', value: 'ug' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Upper Sorbian', value: 'hsb' },
  { label: 'Urdu', value: 'ur' },
  { label: 'Uzbek', value: 'uz' },
  { label: 'Vietnamese', value: 'vi' },
  { label: 'Welsh', value: 'cy' },
  { label: 'Western Frisian', value: 'fy' },
  { label: 'Xhosa', value: 'xh' },
  { label: 'Yiddish', value: 'yi' },
  { label: 'Yoruba', value: 'yo' },
  { label: 'Yucateco', value: 'yua' },
  { label: 'Yue Chinese', value: 'yue' },
  { label: 'Zulu', value: 'zu' },
];

function normalizeTranslationResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, text: '', status: 'fail', raw: response };
  }

  return {
    provider,
    text: providerResult.text || '',
    status: providerResult.status || 'success',
    original_response: providerResult.original_response || null,
    raw: response,
  };
}

export const translateTextAction = createAction({
  name: 'translate_text',
  displayName: 'Translate Text',
  description: 'Translate text into different languages using Eden AI. Supports multiple providers, languages, and models.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use for text translation.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(TRANSLATION_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text to Translate',
      description: 'The text to translate.',
      required: true,
    }),
    source_language: Property.Dropdown({
      displayName: 'Source Language',
      description: 'The language of the input text. Choose "Auto Detection" to automatically detect the language.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(TRANSLATION_LANGUAGES),
      defaultValue: 'auto-detect',
    }),
    target_language: Property.Dropdown({
      displayName: 'Target Language',
      description: 'The language to translate the text into.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(TRANSLATION_LANGUAGES.filter(lang => lang.value !== 'auto-detect')),
    }),
    model: Property.ShortText({
      displayName: 'Specific Model',
      description: 'Specific model to use (e.g., gpt-4o, grok-2-latest). Leave empty for default.',
      required: false,
    }),
    fallback_providers: Property.MultiSelectDropdown({
      displayName: 'Fallback Providers',
      description: 'Alternative providers to try if the main provider fails (up to 5).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(TRANSLATION_PROVIDERS),
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
      text: z.string().min(1, 'Text is required'),
      source_language: z.string().nullish(),
      target_language: z.string().min(1, 'Target language is required'),
      model: z.string().nullish(),
      fallback_providers: z.array(z.string()).max(5).nullish(),
      show_original_response: z.boolean().nullish(),
    });

    const { 
      provider, 
      text, 
      source_language, 
      target_language, 
      model, 
      fallback_providers, 
      show_original_response 
    } = propsValue;

    const body: Record<string, any> = {
      providers: provider,
      text,
      target_language,
    };

    if (source_language && source_language !== 'auto-detect') {
      body['source_language'] = source_language;
    }
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
        resourceUri: '/translation/automatic_translation',
        body,
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeTranslationResponse(provider, response);
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
        throw new Error('Invalid request. Please check your input text and parameters.');
      }
      throw new Error(`Failed to translate text: ${err.message || err}`);
    }
  },
}); 