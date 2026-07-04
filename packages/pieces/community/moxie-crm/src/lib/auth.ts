import { PieceAuth, Property } from '@activepieces/pieces-framework';

export const moxieCRMAuth = PieceAuth.CustomAuth({
  required: true,
  description: `
  To obtain your Moxie CRM token, follow these steps:

  1. Log in to your Moxie CRM account and click on **Workspace Settings** (Bottom left).
  2. Click on **Connected Apps** and navigate to **Integrations** tab.
  3. Now, under "Custom Integration", click on **Enable Custom Integration**.
  4. Copy **API Key** and **Base URL** and click on Save button.
  `,
  props: {
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'The API Key of the Moxie CRM account',
      required: true,
    }),
    baseUrl: Property.ShortText({
      displayName: 'Base URL',
      description: 'The Base URL of the Moxie CRM account',
      required: true,
    }),
  },
});
