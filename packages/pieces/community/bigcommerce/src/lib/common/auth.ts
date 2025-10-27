import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendBigCommerceRequest } from './client';

const markdown = `
**Store Hash**:

You can find your store hash in the BigCommerce control panel URL. For example, if the URL is \`https://store-abc123.mybigcommerce.com/manage\`, then your store hash is **abc123**.

**Access Token**:

1. Login to your BigCommerce store control panel
2. Go to Advanced Settings → API Accounts
3. Click "Create API Account"
4. Select the required OAuth scopes:
   - Customers: read/modify
   - Orders: read/modify
   - Products: read/modify
   - Carts: read/modify
   - Content: read/modify (for blog posts)
5. Save and copy the Access Token

**API Path**:

Use \`/stores/{store_hash}/v3\` for most operations (default).
`;

export const bigcommerceAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
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
    apiPath: Property.ShortText({
      displayName: 'API Path',
      description: 'API path (default: /stores/{store_hash}/v3)',
      required: false,
      defaultValue: '/stores/{store_hash}/v3',
    }),
  },
  validate: async ({ auth }) => {
    try {
      await sendBigCommerceRequest({
        auth,
        method: HttpMethod.GET,
        url: '/store',
      });
      return {
        valid: true,
      };
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Store Hash or Access Token',
      };
    }
  },
});

export type BigCommerceAuth = {
  storeHash: string;
  accessToken: string;
  apiPath?: string;
};