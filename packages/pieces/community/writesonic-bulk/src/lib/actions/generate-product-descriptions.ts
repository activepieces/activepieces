import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { writesonicBulkAuth } from '../common/auth';
import {
  engineDropdownOptions,
  languageDropdownOptions,
  toneofvoiceDropdown,
} from '../common/props';
import { makeRequest } from '../common/client';

export const generateProductDescriptions = createAction({
  auth: writesonicBulkAuth,
  name: 'generateProductDescriptions',
  displayName: 'Generate Product Descriptions',
  description:
    'Generate authentic product descriptions that compel, inspire, and influence',
  props: {
    product_name: Property.ShortText({
      displayName: 'Product Name',
      description: 'The name of the product',
      required: true,
    }),
    product_characteristics: Property.LongText({
      displayName: 'Product Characteristics',
      description: 'Key characteristics and specifications of the product',
      required: true,
    }),
    primary_keyword: Property.ShortText({
      displayName: 'Primary Keyword',
      description: 'The main keyword to include in the product description',
      required: false,
    }),
    secondary_keywords: Property.LongText({
      displayName: 'Secondary Keywords',
      description:
        'Additional keywords to include in the product description, separated by commas',
      required: false,
    }),
    tone_of_voice: toneofvoiceDropdown,
    engine: engineDropdownOptions,
    language: languageDropdownOptions,
    num_copies: Property.Number({
      displayName: 'Number of Copies',
      description: 'Number of blog ideas to generate (1-5)',
      required: true,
      defaultValue: 1,
    }),
  },
  async run(context) {
    const payload: any = {
      product_name: context.propsValue.product_name,
      product_characteristics: context.propsValue.product_characteristics,
    };

    if (context.propsValue.primary_keyword) {
      payload.primary_keyword = context.propsValue.primary_keyword;
    }
    if (context.propsValue.secondary_keywords) {
      payload.secondary_keywords = context.propsValue.secondary_keywords;
    }
    if (context.propsValue.tone_of_voice) {
      payload.tone_of_voice = context.propsValue.tone_of_voice;
    }
    const queryParams = new URLSearchParams({
      engine: context.propsValue.engine,
      language: context.propsValue.language,
      num_copies: context.propsValue.num_copies.toString(),
    });
    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      `/content/product-descriptions?${queryParams.toString()}`,
      payload
    );

    return response;
  },
});
