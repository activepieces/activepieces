import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, propsValidation } from '@activepieces/pieces-common';
import { edenAiApiCall } from '../common/client';
import { createStaticDropdown } from '../common/providers';
import * as z from 'zod/mini'
import { edenAiAuth } from '../..';

const MODERATION_PROVIDERS = [
  { label: 'Microsoft', value: 'microsoft' },
  { label: 'OpenAI', value: 'openai' },
  { label: 'Google', value: 'google' },
];

const MODERATION_LANGUAGES = [
  { label: 'Auto Detection', value: 'auto-detect' },
  { label: 'Afrikaans', value: 'af' },
  { label: 'Albanian', value: 'sq' },
  { label: 'Amharic', value: 'am' },
  { label: 'Arabic', value: 'ar' },
  { label: 'Armenian', value: 'hy' },
  { label: 'Assamese', value: 'as' },
  { label: 'Azerbaijani', value: 'az' },
  { label: 'Basque', value: 'eu' },
  { label: 'Belarusian', value: 'be' },
  { label: 'Bengali', value: 'bn' },
  { label: 'Bosnian', value: 'bs' },
  { label: 'Breton', value: 'br' },
  { label: 'Bulgarian', value: 'bg' },
  { label: 'Catalan', value: 'ca' },
  { label: 'Central Kurdish', value: 'ckb' },
  { label: 'Cherokee', value: 'chr' },
  { label: 'Chinese', value: 'zh' },
  { label: 'Croatian', value: 'hr' },
  { label: 'Czech', value: 'cs' },
  { label: 'Danish', value: 'da' },
  { label: 'Dutch', value: 'nl' },
  { label: 'English', value: 'en' },
  { label: 'Estonian', value: 'et' },
  { label: 'Filipino', value: 'fil' },
  { label: 'Finnish', value: 'fi' },
  { label: 'French', value: 'fr' },
  { label: 'Fulah', value: 'ff' },
  { label: 'Galician', value: 'gl' },
  { label: 'Georgian', value: 'ka' },
  { label: 'German', value: 'de' },
  { label: 'Gujarati', value: 'gu' },
  { label: 'Hausa', value: 'ha' },
  { label: 'Hebrew', value: 'he' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Hungarian', value: 'hu' },
  { label: 'Icelandic', value: 'is' },
  { label: 'Igbo', value: 'ig' },
  { label: 'Indonesian', value: 'id' },
  { label: 'Inuktitut', value: 'iu' },
  { label: 'Irish', value: 'ga' },
  { label: 'Italian', value: 'it' },
  { label: 'Japanese', value: 'ja' },
  { label: 'Kannada', value: 'kn' },
  { label: 'Kazakh', value: 'kk' },
  { label: 'Khmer', value: 'km' },
  { label: 'Kinyarwanda', value: 'rw' },
  { label: 'Kirghiz', value: 'ky' },
  { label: 'Konkani', value: 'kok' },
  { label: 'Korean', value: 'ko' },
  { label: 'Lao', value: 'lo' },
  { label: 'Latvian', value: 'lv' },
  { label: 'Lithuanian', value: 'lt' },
  { label: 'Luxembourgish', value: 'lb' },
  { label: 'Macedonian', value: 'mk' },
  { label: 'Malay', value: 'ms' },
  { label: 'Malayalam', value: 'ml' },
  { label: 'Maltese', value: 'mt' },
  { label: 'Maori', value: 'mi' },
  { label: 'Marathi', value: 'mr' },
  { label: 'Modern Greek', value: 'el' },
  { label: 'Mongolian', value: 'mn' },
  { label: 'Nepali', value: 'ne' },
  { label: 'Norwegian Bokmål', value: 'nb' },
  { label: 'Norwegian Nynorsk', value: 'nn' },
  { label: 'Oriya', value: 'or' },
  { label: 'Panjabi', value: 'pa' },
  { label: 'Pedi', value: 'nso' },
  { label: 'Persian', value: 'fa' },
  { label: 'Polish', value: 'pl' },
  { label: 'Portuguese', value: 'pt' },
  { label: 'Pushto', value: 'ps' },
  { label: 'Quechua', value: 'qu' },
  { label: 'Romanian', value: 'ro' },
  { label: 'Russian', value: 'ru' },
  { label: 'Scottish Gaelic', value: 'gd' },
  { label: 'Serbian', value: 'sr' },
  { label: 'Sindhi', value: 'sd' },
  { label: 'Sinhala', value: 'si' },
  { label: 'Slovak', value: 'sk' },
  { label: 'Slovenian', value: 'sl' },
  { label: 'Southern Sotho', value: 'st' },
  { label: 'Spanish', value: 'es' },
  { label: 'Swahili', value: 'sw' },
  { label: 'Swedish', value: 'sv' },
  { label: 'Tajik', value: 'tg' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Tatar', value: 'tt' },
  { label: 'Telugu', value: 'te' },
  { label: 'Thai', value: 'th' },
  { label: 'Tigrinya', value: 'ti' },
  { label: 'Tswana', value: 'tn' },
  { label: 'Turkish', value: 'tr' },
  { label: 'Turkmen', value: 'tk' },
  { label: 'Uighur', value: 'ug' },
  { label: 'Ukrainian', value: 'uk' },
  { label: 'Urdu', value: 'ur' },
  { label: 'Uzbek', value: 'uz' },
  { label: 'Vietnamese', value: 'vi' },
  { label: 'Welsh', value: 'cy' },
  { label: 'Wolof', value: 'wo' },
  { label: 'Xhosa', value: 'xh' },
  { label: 'Yoruba', value: 'yo' },
  { label: 'Zulu', value: 'zu' },
];

function normalizeModerationResponse(provider: string, response: any) {
  const providerResult = response[provider];
  if (!providerResult) {
    return { provider, nsfw_likelihood: 0, items: [], status: 'fail', raw: response };
  }

  const items = (providerResult.items || []).map((item: any) => ({
    label: item.label || '',
    likelihood: item.likelihood || 0,
    category: item.category || '',
    subcategory: item.subcategory || '',
    likelihood_score: item.likelihood_score || 0,
  }));

  return {
    provider,
    nsfw_likelihood: providerResult.nsfw_likelihood || 0,
    nsfw_likelihood_score: providerResult.nsfw_likelihood_score || 0,
    items,
    status: providerResult.status || 'success',
    original_response: providerResult.original_response || null,
    raw: response,
  };
}

export const moderateTextAction = createAction({
  auth: edenAiAuth,
  name: 'moderate_text',
  classification: 'READ',
  displayName: 'Moderate Text',
  description: 'Check text for explicit or harmful content.',
  audience: 'both',
  aiMetadata: {
    description:
      'Moderate a text for explicit or policy-violating content via Eden AI, routed to a chosen provider, returning an NSFW likelihood plus per-category labels. Use it to screen user-generated or untrusted text before publishing or acting on it. Requires a provider and the text; language defaults to auto-detection. Read-only analysis with no side effect, so it is safe to repeat.',
    idempotent: true,
  },
  propertyGroups: [
    { key: 'content', display: 'section', label: 'Content', icon: 'text', props: ['text', 'language'] },
    { key: 'ai_model', display: 'section', label: 'AI Provider', icon: 'code', props: ['provider', 'model'] },
  ],
  props: {
    provider: Property.Dropdown({
      auth: edenAiAuth,
      displayName: 'Provider',
      description: 'The AI service that runs this step.',
      required: true,
      refreshers: [],
      options: createStaticDropdown(MODERATION_PROVIDERS),
    }),
    text: Property.LongText({
      displayName: 'Text',
      description: 'The text to check.',
      required: true,
    }),
    language: Property.Dropdown({
      auth: edenAiAuth,
      displayName: 'Language',
      description: 'Language of the text. Leave on Auto Detection if unsure.',
      required: false,
      refreshers: [],
      options: createStaticDropdown(MODERATION_LANGUAGES),
      defaultValue: 'auto-detect',
    }),
    model: Property.ShortText({
      displayName: 'Model',
      description: "Leave empty to use the provider's default model.",
      placeholder: 'text-moderation-latest',
      required: false,
    }),
    fallback_providers: Property.MultiSelectDropdown({
      auth: edenAiAuth,
      displayName: 'Fallback Providers',
      description: 'Tried in order if the main provider fails. Up to 5.',
      required: false,
      advanced: true,
      refreshers: [],
      options: createStaticDropdown(MODERATION_PROVIDERS),
    }),
    show_original_response: Property.Checkbox({
      displayName: 'Include Original Response',
      description: "Adds the provider's unprocessed response to the output.",
      required: false,
      advanced: true,
      defaultValue: false,
    }),
  },
  async run({ auth, propsValue }) {
    await propsValidation.validateZod(propsValue, {
      provider: z.string().check(z.minLength(1, 'Provider is required')),
      text: z.string().check(z.minLength(1, 'Text is required')),
      language: z.nullish(z.string()),
      model: z.nullish(z.string()),
      fallback_providers: z.nullish(z.array(z.string()).check(z.maxLength(5))),
      show_original_response: z.nullish(z.boolean()),
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
        apiKey: auth.secret_text,
        method: HttpMethod.POST,
        resourceUri: '/text/moderation',
        body,
      });

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response from Eden AI API.');
      }

      return normalizeModerationResponse(provider, response);
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
      throw new Error(`Failed to moderate text: ${err.message || err}`);
    }
  },
}); 