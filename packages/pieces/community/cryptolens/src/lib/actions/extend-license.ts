import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { cryptolensAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const extendLicense = createAction({
  auth: cryptolensAuth,
  name: 'extendLicense',
  displayName: 'Extend License',
  description: 'Extend a license key by a specified number of days',
  props: {
    productId: Property.Number({
      displayName: 'Product ID',
      description: 'The product ID',
      required: true,
    }),
    key: Property.ShortText({
      displayName: 'License Key',
      description: 'The serial key string to extend',
      required: true,
    }),
    noOfDays: Property.Number({
      displayName: 'Number of Days',
      description: 'The number of days to extend the license. Use negative numbers to decrease the expiration date.',
      required: false,
    }),
  },
  async run(context) {
    const params = new URLSearchParams({
      ProductId: String(context.propsValue.productId),
      Key: context.propsValue.key,
    });

    if (context.propsValue.noOfDays !== undefined && context.propsValue.noOfDays !== null) {
      params.append('NoOfDays', String(context.propsValue.noOfDays));
    }

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/key/ExtendLicense?${params.toString()}`
    );

    return response;
  },
});
