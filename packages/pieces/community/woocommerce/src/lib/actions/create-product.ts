import { createAction, Property } from '@activepieces/pieces-framework';
import {
  httpClient,
  AuthenticationType,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

import { wooAuth } from '../..';

export const wooCreateProduct = createAction({
  name: 'Create Product',
  displayName: 'Create Product',
  description: 'Create a Product',
  auth: wooAuth,
  props: {
    name: Property.ShortText({
      displayName: 'Name',
      description: 'Enter the name',
      required: true,
    }),
    type: Property.StaticDropdown({
      displayName: 'Type',
      description: 'Select the type',
      required: true,
      options: {
        options: [
          {
            label: 'Simple',
            value: 'simple',
          },
          {
            label: 'Grouped',
            value: 'grouped',
          },
          {
            label: 'External',
            value: 'external',
          },
          {
            label: 'Variable',
            value: 'variable',
          },
        ],
      },
    }),
    regular_price: Property.Number({
      displayName: 'Regular price',
      description: 'Enter the regular price',
      required: true,
    }),
    description: Property.LongText({
      displayName: 'Description',
      description: 'Enter the description',
      required: true,
    }),
    short_description: Property.LongText({
      displayName: 'Short description',
      description: 'Enter the short description',
      required: true,
    }),
    categories: Property.ShortText({
      displayName: 'Categories',
      description: 'Enter the category IDs (comma separated)',
      required: true,
    }),
    images: Property.LongText({
      displayName: 'Images',
      description:
        'Enter the URLs of images you want to upload (comma separated)',
      required: true,
    }),
  },
  async run(configValue) {
    const trimmedBaseUrl = configValue.auth.baseUrl.replace(/\/$/, '');

    const name = configValue.propsValue['name'];
    const type = configValue.propsValue['type'];
    const regular_price = configValue.propsValue['regular_price'];
    const description = configValue.propsValue['description'];
    const short_description = configValue.propsValue['short_description'];
    const categories =
      configValue.propsValue['categories'].split(',').map((id) => ({
        id,
      })) || [];
    const images =
      configValue.propsValue['images'].split(',').map((url) => ({
        src: url,
      })) || [];

    const body = {
      name,
      type,
      regular_price,
      description,
      short_description,
      categories,
      images,
    };

    const request: HttpRequest = {
      url: `${trimmedBaseUrl}/wp-json/wc/v3/products`,
      method: HttpMethod.POST,
      authentication: {
        type: AuthenticationType.BASIC,
        username: configValue.auth.consumerKey,
        password: configValue.auth.consumerSecret,
      },
      body,
    };

    const res = await httpClient.sendRequest(request);

    return res.body;
  },
});
