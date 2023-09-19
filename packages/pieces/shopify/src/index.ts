
import { PieceAuth, Property, createPiece } from '@activepieces/pieces-framework';
import { newCancelledOrder } from './lib/triggers/new-cancelled-order';
import { newCustomer } from './lib/triggers/new-customer';
import { newOrder } from './lib/triggers/new-order';
import { newPaidOrder } from './lib/triggers/new-paid-order';
import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const markdown = `
To Obtain an Admin Token, follow these steps:

1. Login to your Shopify account
2. Go to Settings -> Apps
3. Click on Develop apps
4. Create an App
5. Fill the app name
6. Click on Configure Admin API Scopes (Select the following scopes 'read_orders', 'read_customers')
7. Click on Install app
8. Copy the Admin Access Token

**Shop Name**
1- You can find your shop name in the url For example, if the URL is https://example.myshopify.com/admin, then your shop name is **example**.
`

export const shopifyAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    shopName: Property.ShortText({
      displayName: 'Shop Name',
      required: true
    }),
    adminToken: PieceAuth.SecretText({
      displayName: 'Admin Token',
      required: true
    })
  },
  validate: async ({ auth }) => {
    const { shopName, adminToken } = auth;
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: `https://${shopName}.myshopify.com/admin/api/2023-01/shop.json`,
        headers: {
          "X-Shopify-Access-Token": adminToken
        }
      })
      return {
        valid: true
      }
    } catch (e) {
      return {
        valid: false,
        error: 'Invalid Shop Name or Admin Token'
      }
    }
  },
})

export const shopify = createPiece({
  displayName: 'Shopify',
  logoUrl: 'https://cdn.activepieces.com/pieces/shopify.png',
  authors: [
    "abuaboud"
  ],
  minimumSupportedRelease: '0.5.0',
  auth: shopifyAuth,
  actions: [
  ],
  triggers: [
    newCustomer,
    newOrder,
    newPaidOrder,
    newCancelledOrder
  ],
});
