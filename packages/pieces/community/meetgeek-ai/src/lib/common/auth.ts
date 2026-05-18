import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const meetgeekaiAuth = PieceAuth.SecretText({
  displayName: 'API Key',
  description: `Enter your MeetGeek API key to authenticate.

## Acquiring a Token

For service accounts and enterprise company-wide integrations, please use [this form](https://meetgeek.ai/contact) to talk to our team and request a custom quote.

To access the public API, you will need an API key. Follow these steps to obtain your key:

1. Sign up for an account at [app.meetgeek.ai](https://app.meetgeek.ai)
2. Generate your API key by going to **Integrations → Public API Card**
3. Copy and paste the API key into the field below.`,
  required: true,
});
