
    import { OAuth2PropertyValue, PieceAuth, createPiece } from '@activepieces/pieces-framework';
    import { createCustomApiCallAction } from '@activepieces/pieces-common';
    
    import { send_channel_message } from './lib/action/send_channel_message';
import { update_message } from './lib/action/update_message';

    
      export const SlackAuth = PieceAuth.OAuth2({
        description: `### Slack OAuth2 Integration Steps

1. **Create a Slack App:**
   - Navigate to [Slack API](https://api.slack.com) and create a new app.

2. **Configure OAuth & Permissions:**
   - Under 'OAuth & Permissions', add new redirect URLs for your OAuth workflow.
   - Define the scopes you need for your app to function appropriately. These should align with the functionalities you intend to use (e.g., reading channels, sending messages).

3. **Install Your App in Workspace:**
   - You can either install your app in a testing workspace or distribute it to others.
   - After installing, you'll be provided with an OAuth Access Token.

4. **Use the Access Token:**
   - Utilize the access token to make authenticated requests to Slack API endpoints. Include the token in the Authorization header as a Bearer token.

By following these steps, you'll successfully integrate OAuth2 into your Slack application.`,
        authUrl: "https://slack.com/oauth/v2/authorize",
        tokenUrl: "https://slack.com/api/oauth.v2.access",
        required: true,
        scope: ["channels:read","channels:manage","channels:history","chat:write","groups:read","groups:write","reactions:read","mpim:read","mpim:write","im:write","users:read","files:write","files:read","users:read.email","reactions:write"],
      });
    

    export const slacktest = createPiece({
      displayName: 'SlackTest',
      auth: SlackAuth,
      minimumSupportedRelease: '0.20.0',
      logoUrl: 'https://cdn.activepieces.com/pieces/slacktest.png',
      authors: [],
      actions: [
        send_channel_message, update_message,
        createCustomApiCallAction({
          baseUrl: () => {
            return 'https://slack.com/api';
          },
          auth: SlackAuth,
          authMapping: (auth) => {
            return {
              Authorization: `Bearer ${(auth as OAuth2PropertyValue).access_token}`,
            };
          },
        }),
      ],
      triggers: [],
    });
  