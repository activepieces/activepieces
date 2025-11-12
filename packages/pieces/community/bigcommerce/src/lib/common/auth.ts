import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { bigCommerceApiService } from './requests';

export const bigcommerceAuth = PieceAuth.CustomAuth({
  description:
    'Enter your BigCommerce API credentials. ',

  props: {
    instruction: Property.MarkDown({
      value: `1. Login to https://www.bigcommerce.com/essentials/
2. Go to Settings
3. Scroll down to API
4. Click on "Store Level API Accounts"
5. Click "Create API Account" button
6. Enter a name and add required scopes
7. Save - you will get a downloaded file containing your access token and store hash`,
    }),
    storeHash: Property.ShortText({
      displayName: 'Store Hash',
      description: 'Your BigCommerce store hash (e.g., abcd1234)',
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
