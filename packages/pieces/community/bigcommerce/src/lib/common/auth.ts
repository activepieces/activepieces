import { PieceAuth, Property } from "@activepieces/pieces-framework";

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
});