import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { writesonicBulkAuth } from '../common/auth';
import {
  engineDropdownOptions,
  languageDropdownOptions,
} from '../common/props';
import { makeRequest } from '../common/client';

export const googleAds = createAction({
  auth: writesonicBulkAuth,
  name: 'googleAds',
  displayName: 'Google Ads',
  description:
    'Generate quality ads that rank in search results and drive more traffic',
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
    search_term: Property.ShortText({
      displayName: 'Search Term',
      description:
        'The search term or query to target in the Google Ads campaign',
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
      search_term: context.propsValue.search_term,
    };
    const queryParams = new URLSearchParams({
      engine: context.propsValue.engine,
      language: context.propsValue.language,
      num_copies: context.propsValue.num_copies.toString(),
    });
    const response = await makeRequest(
      context.auth,
      HttpMethod.POST,
      `/content/google-ads?${queryParams.toString()}`,
      payload
    );

    return response;
  },
});
