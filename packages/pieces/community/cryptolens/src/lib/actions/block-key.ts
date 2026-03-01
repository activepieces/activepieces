import { createAction, Property } from '@activepieces/pieces-framework';
import { makeRequest } from '../common/client';
import { cryptolensAuth } from '../common/auth';
import { HttpMethod } from '@activepieces/pieces-common';

export const blockKey = createAction({
  auth: cryptolensAuth,
  name: 'blockKey',
  displayName: 'Block Key',
  description: 'Block a license key to prevent it from being accessible by most Web API methods',
  props: {
    productId: Property.Number({
      displayName: 'Product ID',
      description: 'The product ID',
      required: true,
    }),
    key: Property.ShortText({
      displayName: 'License Key',
      description: 'The serial key string to block',
      required: true,
    }),
  },
  async run(context) {
    const params = new URLSearchParams({
      ProductId: String(context.propsValue.productId),
      Key: context.propsValue.key,
    });

    const response = await makeRequest(
      context.auth.secret_text,
      HttpMethod.POST,
      `/key/BlockKey?${params.toString()}`
    );

    return response;
  },
});
