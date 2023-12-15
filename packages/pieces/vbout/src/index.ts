import { createPiece, PieceAuth } from '@activepieces/pieces-framework';
import { vboutGetContactByEmailAction } from './lib/actions/get-contact-by-email';
import { vboutGetEmailListAction } from './lib/actions/get-email-list';
import { vboutCreateEmailListAction } from './lib/actions/create-email-list';
const markdown = `
To obtain your API key, follow these steps:

1.Go to **settings** by clicking your profile-pic (top-right).
2.Navigate to **API Integrations** section.
3.Under **API USER KEY** ,copy API key.
`;

export const vboutAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  required: true,
  description: markdown,
});
export const vbout = createPiece({
  displayName: 'Vbout',
  auth: vboutAuth,
  minimumSupportedRelease: '0.9.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/vbout.png',
  authors: ['kishanprmr'],
  actions: [
    vboutGetContactByEmailAction,
    vboutGetEmailListAction,
    vboutCreateEmailListAction,
  ],
  triggers: [],
});
