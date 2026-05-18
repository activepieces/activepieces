import {
  PieceAuth,
  Property,
  createPiece,
} from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import actions from './lib/actions';

const markdownDescription = `
Here are the simple steps to get your credentials:

1. Make an account, If you don't have one yet.
2. Go to **https://pastebin.com/doc_api**.
3. Copy your unique Developer API Key and paste it.
4. Provide your username and password if you want to create **private pastes** under your account.
`;

export const pastebinAuth = PieceAuth.CustomAuth({
  required: true,
  description: markdownDescription,
  props: {
    token: PieceAuth.SecretText({
      displayName: 'Developer Key',
      required: true,
    }),
    username: Property.ShortText({
      displayName: 'Username',
      required: false,
    }),
    password: PieceAuth.SecretText({
      displayName: 'Password',
      required: false,
    }),
  },
});

export const pastebin = createPiece({
  displayName: 'Pastebin',
  description: 'Simple and secure text sharing',

  minimumSupportedRelease: '0.30.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/pastebin.png',
  authors: ["JanHolger","kishanprmr","khaledmashaly","abuaboud"],
  categories: [],
  auth: pastebinAuth,
  actions,
  triggers: [],
});
