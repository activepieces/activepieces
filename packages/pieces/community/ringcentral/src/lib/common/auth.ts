import { PieceAuth, Property } from '@activepieces/pieces-framework';

const markdownDescription =
  "In the [RingCentral Developer Console](https://developers.ringcentral.com/), create a REST API app using **OAuth 2.0 (Authorization Code Flow)** for a server/web app. Add the redirect URI shown here to the app, then enable the app scopes you need (for example: SMS, RingOut, Read Messages, Read Call Log, Read Accounts, TeamMessaging, Webhook Subscriptions). Copy the app's Client ID and Client Secret below, and pick the Environment that matches your app.";

export const ringcentralAuth = PieceAuth.OAuth2({
  description: markdownDescription,
  required: true,
  props: {
    environment: Property.StaticDropdown({
      displayName: 'Environment',
      description: 'The RingCentral server your app is registered on.',
      required: true,
      defaultValue: 'platform.ringcentral.com',
      options: {
        disabled: false,
        options: [
          { label: 'Production', value: 'platform.ringcentral.com' },
          { label: 'Sandbox', value: 'platform.devtest.ringcentral.com' },
        ],
      },
    }),
  },
  authUrl: 'https://{environment}/restapi/oauth/authorize',
  tokenUrl: 'https://{environment}/restapi/oauth/token',
  scope: [],
});
