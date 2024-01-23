import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import actions from './lib/actions';
import triggers from './lib/triggers';

const markdown = `
Create an account and obtain the API Key from Pastefy.
`;

export const pastefyAuth = PieceAuth.CustomAuth({
  description: markdown,
  required: true,
  props: {
    instance_url: Property.ShortText({
      displayName: 'Pastefy Instance URL',
      required: false,
      defaultValue: 'https://pastefy.app',
    }),
    token: PieceAuth.SecretText({
      displayName: 'API-Token',
      required: false,
    }),
  },
});

export const pastefy = createPiece({
  displayName: 'Pastefy',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pastefy.png',
  authors: ['JanHolger'],
  auth: pastefyAuth,
  actions,
  triggers: triggers,
});
