import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { bigCommerceApiService } from './requests';

export const bigcommerceAuth = PieceAuth.CustomAuth({
  description: 'Enter your BigCommerce API credentials',
  props: {
    storeHash: Property.ShortText({
      displayName: 'Store Hash',
      description: 'Your BigCommerce store hash',
      required: true,
    }),
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'Your BigCommerce API access token',
      required: true,
    }),
  },
  required: true,
  async validate(context) {
    try {
      await bigCommerceApiService.fetchProducts({
        auth: context.auth,
      });
      return { valid: true };
    } catch {
      return {
        valid: false,
        error:
          'Could not validate credentials. please check your credentials are correct.',
      };
    }
  },
});
