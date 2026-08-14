import {
  OAuth2AuthorizationMethod,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

export const ringcentralAuth = PieceAuth.OAuth2({
  description:
    "In the [RingCentral Developer Console](https://developers.ringcentral.com/), create a REST API app using **OAuth 2.0 (Authorization Code Flow)** for a server/web app. Add the redirect URI shown here to the app, then enable the app scopes you need (for example: SMS, RingOut, Read Messages, Read Call Log, Read Accounts, TeamMessaging, Webhook Subscriptions). Copy the app's Client ID and Client Secret below, and pick the Environment that matches your app.",
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
  // RingCentral's token endpoint answers client creds in the request body with OAU-123 "Client
  // authentication is required" before it looks at the grant, and the framework defaults to
  // OAuth2AuthorizationMethod.BODY. Refresh reads the same stored method, so BODY breaks reconnects too.
  authorizationMethod: OAuth2AuthorizationMethod.HEADER,
  authUrl: 'https://{environment}/restapi/oauth/authorize',
  tokenUrl: 'https://{environment}/restapi/oauth/token',
  scope: [],
  // The platform's default prompt=consent sends RingCentral's login to SSO-only (API_ERROR_208).
  prompt: 'omit',
});
