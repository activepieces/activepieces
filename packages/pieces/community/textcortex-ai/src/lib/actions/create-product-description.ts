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

export const createProductDescription = createAction({
  auth: textCortexAuth,
  name: 'create_product_description',
  displayName: 'Create Product Description',
  description: 'Create a product description using details like name, brand, category, features, keywords.',
  props: {
    name: Property.ShortText({
      displayName: 'Product Name',
      description: 'Name of the product.',
      required: false,
    }),
    brand: Property.ShortText({
      displayName: 'Brand',
      description: 'Brand of the product.',
      required: false,
    }),
    category: Property.ShortText({
      displayName: 'Category',
      description: 'Category of the product.',
      required: false,
    }),
    description: Property.LongText({
      displayName: 'Features',
      description: 'Features of the product.',
      required: false,
    }),
    keywords: Property.Array({
      displayName: 'Keywords',
      description: 'Keywords to include in the product description.',
      required: false,
      properties: {
        keyword: Property.ShortText({
          displayName: 'Keyword',
          description: 'A keyword to include in the product description.',
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
      name,
      brand,
      category,
      description,
      keywords,
      model,
      max_tokens,
      temperature,
      n,
      formality,
      source_lang,
      target_lang,
    } = propsValue;

    const body: Record<string, unknown> = {};

    if (name) body['name'] = name;
    if (brand) body['brand'] = brand;
    if (category) body['category'] = category;
    if (description) body['description'] = description;
    
    // Convert keywords array to string array
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
      url: '/texts/products/descriptions',
      auth: auth,
      body,
    });
  },
});
