import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { sendBigCommerceRequest } from './client';

const markdown = `
**Store Hash**:

Find your store hash from your BigCommerce control panel URL:
- URL: \`https://store-abc123.mybigcommerce.com/manage\`
- Store Hash: \`abc123\` (without "store-" prefix)

**Access Token**:

1. Login to your BigCommerce store control panel
2. Go to **Advanced Settings** → **API Accounts**
3. Click **"Create API Account"**
4. Enter a name: \`Activepieces Integration\`
5. **IMPORTANT**: Select these OAuth scopes:
   - ✅ **Store Information**: read-only
   - ✅ **Customers**: modify
   - ✅ **Orders**: modify
   - ✅ **Products**: modify
   - ✅ **Carts**: modify
   - ✅ **Content**: modify
   - ✅ **Information & Settings**: modify
6. Click **Save** and immediately copy the **Access Token**

**Troubleshooting**:
- Store Hash: Use only the hash part (e.g., "abc123" not "store-abc123")
- Access Token: Must be copied immediately after creation
- Scopes: All listed scopes above are required
- API Path: Leave default unless using custom setup

**Common Issues**:
- 401 Error: Wrong access token or expired token
- 404 Error: Wrong store hash format
- 403 Error: Missing required OAuth scopes
`;

export const bigcommerceAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    storeHash: Property.ShortText({
      displayName: 'Store Hash',
      description: 'Your BigCommerce store hash (without "store-" prefix)',
      required: true,
    }),
    accessToken: Property.ShortText({
      displayName: 'Access Token',
      description: 'Your BigCommerce API access token',
      required: true,
    }),
  },
  validate: async ({ auth }) => {
    // List of endpoints to try for validation (in order of preference)
    const validationEndpoints = [
      '/catalog/products?limit=1',  // Most reliable endpoint
      '/customers?limit=1',         // Alternative endpoint
      '/time',                      // Simple endpoint
      '/store',                     // Original endpoint
    ];

    let lastError: any = null;

    for (const endpoint of validationEndpoints) {
      try {
        console.log(`Trying validation with endpoint: ${endpoint}`);

        const response = await sendBigCommerceRequest({
          auth,
          method: HttpMethod.GET,
          url: endpoint,
        });

        if (response.status === 200) {
          console.log(`Validation successful with endpoint: ${endpoint}`);
          return {
            valid: true,
          };
        }

        console.log(`Endpoint ${endpoint} returned status: ${response.status}`);
      } catch (e: any) {
        console.error(`Endpoint ${endpoint} failed:`, e);
        lastError = e;

        // If we get a 401, the token is definitely wrong, no need to try other endpoints
        if (e?.response?.status === 401) {
          return {
            valid: false,
            error: 'Invalid Access Token - Please verify your API token is correct and not expired',
          };
        }

        // Continue to next endpoint
        continue;
      }
    }

    // If all endpoints failed, return error based on the last attempt
    let errorMessage = 'Authentication failed - Unable to validate credentials';
    let debugInfo = '';

    if (lastError?.response) {
      const status = lastError.response.status;
      const responseBody = lastError.response.body;

      debugInfo = `Status: ${status}, Response: ${JSON.stringify(responseBody)}`;

      switch (status) {
        case 401:
          errorMessage = 'Invalid Access Token - Please verify your API token is correct and not expired';
          break;
        case 404:
          errorMessage = 'Invalid Store Hash - Please verify your store hash is correct (without "store-" prefix)';
          break;
        case 403:
          errorMessage = 'Insufficient permissions - Please ensure your API account has the required OAuth scopes';
          break;
        default:
          errorMessage = `HTTP ${status} error - ${responseBody?.title || responseBody?.message || 'Unknown error'}`;
      }
    } else if (lastError?.message) {
      errorMessage = `Network error: ${lastError.message}`;
      debugInfo = lastError.message;
    }

    return {
      valid: false,
      error: `${errorMessage}. Debug: ${debugInfo}`,
    };
  },
});

export type BigCommerceAuth = {
  storeHash: string;
  accessToken: string;
};