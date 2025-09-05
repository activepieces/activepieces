import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { textcortexAuth } from '../common/auth';
import { textcortexCommon } from '../common/client';
import { API_ENDPOINTS, AI_MODELS, FORMALITY_LEVELS, LANGUAGES } from '../common/common';

export const createProductDescription = createAction({
  auth: textcortexAuth,
  name: 'create_product_description',
  displayName: 'Create Product Description',
  description: 'Create a product description using details like name, brand, category, features, keywords.',
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Name of the product',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Product Features',
      description: 'Features of the product',
      required: false,
    }),
    brand: Property.ShortText({
      displayName: 'Brand',
      description: 'Brand of the product',
      required: false,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'Category of the product',
      required: false,
    }),
    keywords: Property.ShortText({
      displayName: 'Keywords',
      description: 'Keywords to include in the product description (comma-separated)',
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
      description: 'The language for the product description',
      required: false,
      defaultValue: 'en',
      options: {
        options: [
          { label: 'English (American)', value: 'en' },
          { label: 'English (British)', value: 'en-gb' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' },
          { label: 'German', value: 'de' },
          { label: 'Portuguese (Brazilian)', value: 'pt-br' },
          { label: 'Portuguese', value: 'pt' },
          ...LANGUAGES.filter(lang => !['en', 'pt', 'es', 'fr', 'de'].includes(lang.value)),
        ],
      },
    }),
    max_tokens: Property.Number({
      displayName: 'Max Tokens',
      description: 'Maximum length of product description (1-4096 tokens)',
      required: false,
      defaultValue: 2048,
    }),
    temperature: Property.Number({
      displayName: 'Temperature',
      description: 'Controls creativity (0.0-2.0). Higher values = more creative, lower = more focused.',
      required: false,
    }),
    n: Property.Number({
      displayName: 'Number of Outputs',
      description: 'How many descriptions to generate (1-5)',
      required: false,
      defaultValue: 1,
    }),
  },
  async run(context) {
    try {
      const requestBody: any = {};

    if (context.propsValue.name) {
      requestBody.name = context.propsValue.name;
    }

    if (context.propsValue.description) {
      requestBody.description = context.propsValue.description;
    }

    if (context.propsValue.brand) {
      requestBody.brand = context.propsValue.brand;
    }

    if (context.propsValue.category) {
      requestBody.category = context.propsValue.category;
    }

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
      resourceUri: API_ENDPOINTS.PRODUCT_DESCRIPTIONS,
      body: requestBody,
    });

    const outputs = response.body.data?.outputs || [];
    const generatedDescription = outputs.length > 0 ? outputs[0].text : response.body.text || response.body;

    return {
      success: true,
      product_description: generatedDescription,
      outputs: outputs,
      remaining_credits: response.body.data?.remaining_credits,
      metadata: {
        product_name: context.propsValue.name,
        brand: context.propsValue.brand,
        category: context.propsValue.category,
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
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid API key. Please check your TextCortex API key.');
      }
      if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please wait and try again or upgrade your TextCortex plan.');
      }
      if (error.response?.status === 400) {
        throw new Error('Invalid request. Please check your input parameters.');
      }
      if (error.message?.includes('network') || error.message?.includes('timeout')) {
        throw new Error('Network error. Please check your connection and try again.');
      }

      throw new Error(`Product description generation failed: ${error.message || 'Unknown error'}`);
    }
  },
});