import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { textCortexApiCall } from '../common/client';
import { textCortexAuth } from '../common/auth';
import { 
  sourceLangProperty, 
  targetLangProperty, 
  modelProperty, 
  formalityProperty
} from '../common/props';

export const createSocialMediaCaption = createAction({
  auth: textCortexAuth,
  name: 'create_social_media_caption',
  displayName: 'Create Social Media Caption',
  description: 'Generate a caption tailored for a specific social media channel (requires channel and keywords).',
  props: {
    context: Property.LongText({
      displayName: 'Context',
      description: 'The context of the social media post.',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Platform',
      description: 'The platform to generate the social media post for',
      required: true,
      options: {
        options: [
          { label: 'Twitter', value: 'twitter' },
          { label: 'LinkedIn', value: 'linkedin' },
        ],
      },
    }),
    keywords: Property.Array({
      displayName: 'Keywords',
      description: 'Keywords to be included in the post.',
      required: false,
      properties: {
        keyword: Property.ShortText({
          displayName: 'Keyword',
          description: 'A keyword to include in the post.',
          required: true,
        }),
      },
    }),
    model: modelProperty,
    max_tokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'The maximum number of tokens to generate.',
      required: false,
      defaultValue: 2048,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'The sampling temperature to be used in text generation. The higher the temperature, the higher the risk of the output to sound "made up".',
      required: false,
    }),
    n: Property.Number({
      displayName: 'Number of Outputs',
      description: 'The number of outputs to generate.',
      required: false,
      defaultValue: 1,
    }),
    formality: formalityProperty,
    source_lang: sourceLangProperty,
    target_lang: targetLangProperty,
  },
  async run({ propsValue, auth }) {
    const {
      context,
      mode,
      keywords,
      model,
      max_tokens,
      temperature,
      n,
      formality,
      source_lang,
      target_lang,
    } = propsValue;

    const body: Record<string, unknown> = {
      context,
      mode,
    };

    if (keywords && Array.isArray(keywords) && keywords.length > 0) {
      body['keywords'] = keywords
        .filter((item: any) => item.keyword && item.keyword.trim())
        .map((item: any) => item.keyword.trim());
    }

    if (model) body['model'] = model;
    if (max_tokens) body['max_tokens'] = max_tokens;
    if (temperature !== undefined && temperature !== null) body['temperature'] = temperature;
    if (n) body['n'] = n;
    if (formality) body['formality'] = formality;
    if (source_lang) body['source_lang'] = source_lang;
    if (target_lang) body['target_lang'] = target_lang;

    return await textCortexApiCall({
      method: HttpMethod.POST,
      url: '/texts/social-media-posts',
      auth: auth,
      body,
    });
  },
});
