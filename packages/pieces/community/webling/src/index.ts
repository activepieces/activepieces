import {
  createPiece,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

export const weblingAuth = PieceAuth.CustomAuth({
  required: true,
  props: {
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      required: true,
      defaultValue: 'example.webling.ch',
    }),
    apikey: PieceAuth.SecretText({
      displayName: 'API Key',
      required: true,
    }),
  },
  // TODO: Validation
});

export const webling = createPiece({
  displayName: 'Webling',
  auth: weblingAuth,
  minimumSupportedRelease: '0.20.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/webling.png',
  authors: [],
  actions: [],
  triggers: [],
});
