import { PieceAuth, createPiece } from '@activepieces/pieces-framework';
import { PieceCategory } from '@activepieces/shared';
import { createOrUpdateSubscriber } from './lib/actions/create-or-update-subscription';

const markdownDescription = `
To obtain your API key, follow these steps:

1. Log in to your MailerLite account.
2. Visit the [API page](https://dashboard.mailerlite.com/integrations/api).
3. Click the **Generate new token** button.
4. Copy the generated API key.
`;

export const mailerListAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
});

export const mailerLite = createPiece({
  displayName: 'MailerLite',
  minimumSupportedRelease: '0.5.0',
  logoUrl: 'https://cdn.activepieces.com/pieces/mailer-lite.png',
  authors: ['Willianwg'],
  categories: [PieceCategory.MARKETING],
  auth: mailerListAuth,
  actions: [createOrUpdateSubscriber],
  triggers: [],
});
