import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import { z } from 'zod';

const SPELL_CHECK_PROVIDERS = [
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'ProWritingAid', value: 'prowritingaid' },
  { label: 'Cohere', value: 'cohere' },
  { label: 'Sapling', value: 'sapling' },
  { label: 'XAI Grok', value: 'xai' },
];

const SPELL_CHECK_LANGUAGES = [
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
  { label: 'Cebuano', value: 'ceb' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Chinese (China)', value: 'zh-CN' },
  { label: 'Chinese (Simplified)', value: 'zh-hans' },
  { label: 'Chinese (Taiwan)', value: 'zh-TW' },
  { label: 'Chinese (Traditional)', value: 'zh-hant' },
  { label: 'Corsican', value: 'co' },
  { label: 'Croatian', value: 'hr' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Dutch', value: 'nl' },
  { label: 'English', value: 'en' },
  { label: 'English (United Kingdom)', value: 'en-gb' },
  { label: 'Esperanto', value: 'eo' },
  { label: 'Estonian', value: 'et' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
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
  { label: 'Hungarian', value: 'hu' },
  { label: 'Icelandic', value: 'is' },
  { label: 'Igbo', value: 'ig' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Irish', value: 'ga' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Japanese (JP)', value: 'jp' },
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
  { label: 'Norwegian Bokmål', value: 'nb' },
  { label: 'Nyanja', value: 'ny' },
  { label: 'Oriya', value: 'or' },
  { label: 'Panjabi', value: 'pa' },
  { label: 'Persian', value: 'fa' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Portuguese (Brazil)', value: 'pt-br' },
  { label: 'Portuguese (Portugal)', value: 'pt-pt' },
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

function normalizeSpellCheckResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, text: '', items: [], status: 'fail', raw: response };
  }

  const items = (providerResult.items || []).map((item: any) => ({
    text: item.text || '',
    type: item.type || '',
    offset: item.offset || 0,
    length: item.length || 0,
    suggestions: (item.suggestions || []).map((suggestion: any) => ({
      suggestion: suggestion.suggestion || '',
      score: suggestion.score || 0,
    })),
  }));

  return {
    provider,
    text: providerResult.text || '',
    items,
    status: providerResult.status || 'success',
    original_response: providerResult.original_response || null,
    raw: response,
  };
}

export const spellCheckAction = createAction({
  name: 'spell_check',
  displayName: 'Spell Check',
  description: 'Identify and correct spelling or grammar errors using Eden AI. Supports multiple providers, languages, and models.',
  props: {
    provider: Property.Dropdown({
      displayName: 'Provider',
      description: 'The AI provider to use for spell checking and grammar correction.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(SPELL_CHECK_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text to Check',
      description: 'The text to check for spelling or grammar errors.',
      required: true,
    }),
    language: Property.Dropdown({
      displayName: 'Text Language',
      description: 'The language of the input text. Choose "Auto Detection" if unsure.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(SPELL_CHECK_LANGUAGES),
      defaultValue: 'auto-detect',
    }),
    model: Property.ShortText({
      displayName: 'Specific Model',
      description: 'Specific model to use (e.g., gpt-4o, gpt-4, grok-2-latest, command). Leave empty for default.',
      required: false,
    }),
    fallback_providers: Property.MultiSelectDropdown({
      displayName: 'Fallback Providers',
      description: 'Alternative providers to try if the main provider fails (up to 5).',
      required: false,
      refreshers: [],
      options: createStaticDropdown(SPELL_CHECK_PROVIDERS),
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
      language: z.string().nullish(),
      model: z.string().nullish(),
      fallback_providers: z.array(z.string()).max(5).nullish(),
      show_original_response: z.boolean().nullish(),
    });

    const { 
      provider, 
      text, 
      language, 
      model, 
      fallback_providers, 
      show_original_response 
    } = propsValue;

    const body: Record<string, any> = {
      providers: provider,
      text,
    };

    if (language && language !== 'auto-detect') body['language'] = language;
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
        resourceUri: '/text/spell_check',
        body,
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeSpellCheckResponse(provider, response);
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
      throw new Error(`Failed to check spelling: ${err.message || err}`);
    }
  },
}); 