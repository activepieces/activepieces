import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { textcortexAuth } from '../common/auth';
import { textcortexCommon } from '../common/client';
import { API_ENDPOINTS, AI_MODELS, FORMALITY_LEVELS, LANGUAGES } from '../common/common';

export const createSocialMediaCaption = createAction({
  auth: textcortexAuth,
  name: 'create_social_media_caption',
  displayName: 'Generate Social Media Post',
  description: 'Generate engaging social media posts for Twitter and LinkedIn with optimized content and hashtags.',
  props: {
    context: Property.LongText({
      displayName: 'Post Context',
      description: 'Describe what you want to post about (e.g., "Announcing our new product launch with 50% discount")',
      required: true,
    }),
    mode: Property.StaticDropdown({
      displayName: 'Platform',
      description: 'The platform to generate a post for',
      required: true,
      options: {
        options: [
          { label: 'Twitter', value: 'twitter' },
          { label: 'LinkedIn', value: 'linkedin' },
        ],
      },
    }),
    keywords: Property.ShortText({
      displayName: 'Keywords',
      description: 'Keywords to be included in the post (comma-separated)',
      required: false,
    }),
    model: Property.StaticDropdown({
      displayName: 'Model',
      description: 'The language model to use',
      required: false,
      defaultValue: 'gemini-2-0-flash',
      options: {
        options: AI_MODELS,
      },
    }),
    formality: Property.StaticDropdown({
      displayName: 'Formality',
      description: 'The formality of the generated text',
      required: false,
      defaultValue: 'default',
      options: {
        options: FORMALITY_LEVELS,
      },
    }),
    source_lang: Property.StaticDropdown({
      displayName: 'Source Language',
      description: 'The language of the source text',
      required: false,
      defaultValue: 'en',
      options: {
        options: [
          { label: 'English (Default)', value: 'en' },
          { label: 'Auto-detect', value: 'auto' },
          ...LANGUAGES.filter(lang => lang.value !== 'en'),
        ],
      },
    }),
    target_lang: Property.StaticDropdown({
      displayName: 'Target Language',
      description: 'The language which the text should be generated in',
      required: false,
      defaultValue: 'en',
      options: {
        options: [
          { label: 'English (American)', value: 'en' },
          { label: 'English (British)', value: 'en-gb' },
          { label: 'Portuguese (Brazilian)', value: 'pt-br' },
          { label: 'Portuguese', value: 'pt' },
          ...LANGUAGES.filter(lang => !['en', 'pt'].includes(lang.value)),
        ],
      },
    }),
    max_tokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'The maximum number of tokens to generate',
      required: false,
      defaultValue: 2048,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'The sampling temperature to be used in text generation',
      required: false,
    }),
    n: Property.Number({
      displayName: 'Number of Outputs',
      description: 'The number of outputs to generate',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const requestBody: any = {
      context: context.propsValue.context,
      mode: context.propsValue.mode,
    };

    if (context.propsValue.keywords) {
      requestBody.keywords = context.propsValue.keywords.split(',').map(k => k.trim());
    }

    if (context.propsValue.model && context.propsValue.model !== 'gemini-2-0-flash') {
      requestBody.model = context.propsValue.model;
    }

    if (context.propsValue.formality && context.propsValue.formality !== 'default') {
      requestBody.formality = context.propsValue.formality;
    }

    if (context.propsValue.source_lang && context.propsValue.source_lang !== 'en') {
      requestBody.source_lang = context.propsValue.source_lang;
    }

    if (context.propsValue.target_lang && context.propsValue.target_lang !== 'en') {
      requestBody.target_lang = context.propsValue.target_lang;
    }

    if (context.propsValue.max_tokens && context.propsValue.max_tokens !== 2048) {
      requestBody.max_tokens = context.propsValue.max_tokens;
    }

    if (context.propsValue.temperature !== undefined) {
      requestBody.temperature = context.propsValue.temperature;
    }

    if (context.propsValue.n && context.propsValue.n !== 1) {
      requestBody.n = context.propsValue.n;
    }

    const response = await textcortexCommon.apiCall({
      auth: context.auth,
      method: HttpMethod.POST,
      resourceUri: API_ENDPOINTS.SOCIAL_MEDIA_POSTS,
      body: requestBody,
    });

    const outputs = response.body.data?.outputs || [];
    const generatedCaption = outputs.length > 0 ? outputs[0].text : response.body.text || response.body;

    return {
      success: true,
      caption: generatedCaption,
      outputs: outputs,
      remaining_credits: response.body.data?.remaining_credits,
      metadata: {
        context: context.propsValue.context,
        platform: context.propsValue.mode,
        keywords: context.propsValue.keywords,
        model: context.propsValue.model || 'gemini-2-0-flash',
        formality: context.propsValue.formality || 'default',
        parameters: {
          max_tokens: context.propsValue.max_tokens || 2048,
          temperature: context.propsValue.temperature,
          n: context.propsValue.n || 1,
          source_lang: context.propsValue.source_lang || 'en',
          target_lang: context.propsValue.target_lang || 'en',
        },
        timestamp: new Date().toISOString(),
      }
    };
  },
});