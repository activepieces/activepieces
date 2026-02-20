import { PieceAuth } from '@activepieces/pieces-framework';

export const whatsappOrderNotificationAuth = PieceAuth.SecretText({
    displayName: 'API Key',
    description: `Enter your API key here. To generate your API key:

1. Log in to your [Assistro account](https://app.assistro.co).
2. Go to the **Configuration** page.
3. Enable the **Activepieces Add-on**.
4. Once activated, your API key will be generated automatically.
5. Copy the API key and paste it here.`,
    required: true,
});
