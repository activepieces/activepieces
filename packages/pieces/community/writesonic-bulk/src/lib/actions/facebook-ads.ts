import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { writesonicBulkAuth } from '../common/auth';
import {
  engineDropdownOptions,
  languageDropdownOptions,
} from '../common/props';
import { makeRequest } from '../common/client';

export const facebookAds = createAction({
  auth: writesonicBulkAuth,
  name: 'facebookAds',
  displayName: 'Facebook Ads',
  description: 'Generate Facebook ad copies that make your ads truly stand out',
  props: {
    product_name: Property.ShortText({
      displayName: 'Product Name',
      description: 'The name of the product or service to advertise',
      required: true,
    }),
    product_description: Property.LongText({
      displayName: 'Product Description',
      description: 'A brief description of the product or service',
      required: false,
    }),
    occasion: Property.ShortText({
      displayName: 'Occasion',
      description:
        'The occasion for the ad (e.g.,"Black Friday", holiday, sale event)',
      required: false,
    }),
    promotion: Property.ShortText({
      displayName: 'Promotion',
      description: 'Details about any promotion or discount',
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
    const payload = {
      product_name: context.propsValue.product_name,
      product_description: context.propsValue.product_description,
      occasion: context.propsValue.occasion,
      promotion: context.propsValue.promotion,
    };
    const queryParams = new URLSearchParams({
      engine: context.propsValue.engine,
      language: context.propsValue.language,
      num_copies: context.propsValue.num_copies.toString(),
    });
    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      `/content/facebook-ads?${queryParams.toString()}`,
      payload
    );

    return response;
  },
});
