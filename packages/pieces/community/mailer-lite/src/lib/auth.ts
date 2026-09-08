import { PieceAuth } from '@activepieces/pieces-framework';

const markdownDescription = `
To obtain your API key, follow these steps:

1. Log in to your MailerLite account.
2. Visit the [API page](https://dashboard.mailerlite.com/integrations/api).
3. Click the **Generate new token** button.
4. Copy the generated API key.
`;

export const mailerLiteAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: markdownDescription,
  required: true,
});
