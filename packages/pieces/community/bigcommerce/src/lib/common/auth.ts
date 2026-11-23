import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { BigCommerceError, bigCommerceApiService } from './requests';

export const bigcommerceAuth = PieceAuth.CustomAuth({
  description: 'Enter your BigCommerce API credentials.',

  props: {
    instruction: Property.MarkDown({
      value: `1. Log in to your BigCommerce store control panel.
2. Go to **Settings** > **API** > **Store-level API accounts**.
3. Click **Create API account** and pick the token type **V2/V3 API token**.
4. Give it a name and set these scopes:
   - **Products**: modify
   - **Customers**: modify
   - **Orders**: modify
   - **Content**: modify (for blog posts)
   - **Carts**: read-only (for the cart triggers)
5. Click **Save**, then copy the **Access Token** and the **API Path**.
6. The Store Hash is the part of the API Path after \`/stores/\`. For \`https://api.bigcommerce.com/stores/abcd1234/v3/\` it is \`abcd1234\`.`,
    }),
    storeHash: Property.ShortText({
      displayName: 'Store Hash',
      description: 'Your BigCommerce store hash (e.g., abcd1234). You can also paste the full API Path.',
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
        query: { limit: 1 },
      });
      return { valid: true };
    } catch (error) {
      if (error instanceof BigCommerceError && (error.status === 401 || error.status === 403)) {
        return {
          valid: false,
          error:
            'Invalid credentials: BigCommerce rejected the Access Token for this Store Hash, or the token is missing the Products read scope.',
        };
      }
      return {
        valid: false,
        error: `Could not validate the connection: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
