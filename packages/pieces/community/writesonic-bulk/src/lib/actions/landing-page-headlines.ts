import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { writesonicBulkAuth } from '../common/auth';
import {
  engineDropdownOptions,
  languageDropdownOptions,
} from '../common/props';
import { makeRequest } from '../common/client';

export const landingPageHeadlines = createAction({
  auth: writesonicBulkAuth,
  name: 'landingPageHeadlines',
  displayName: 'Landing Page Headlines',
  description:
    'Generate unique and catchy headlines perfect for your product or service',
  props: {
    product_name: Property.ShortText({
      displayName: 'Product Name',
      description: 'The name of the product or service',
      required: true,
    }),
    product_description: Property.LongText({
      displayName: 'Product Description',
      description: 'A brief description of the product or service',
      required: false,
    }),
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
      product_description: context.propsValue.product_description,
    };
    const queryParams = new URLSearchParams({
      engine: context.propsValue.engine,
      language: context.propsValue.language,
      num_copies: context.propsValue.num_copies.toString(),
    });
    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      `/content/landing-page-headlines?${queryParams.toString()}`,
      payload
    );

    return response;
  },
});
