import { PieceAuth, Property } from '@activepieces/pieces-framework';
import { httpClient, HttpMethod, AuthenticationType } from '@activepieces/pieces-common';

const authGuide = `
### To obtain your Vimeo API access token, follow these steps:

1. After creating the app, navigate to https://developer.vimeo.com/apps
2. Select your app
3. Scroll and find **Authentication** -> **Generate an access token**
4. Select: **Authenticated (you)**
5. Select this scope: **[ Private, Edit, Delete, Upload, Video Files ]**
  - You need to do request upload access if it's not available
6. Click the **Generate** button
7. Copy the created token and paste it into the **Access Token** field below.

### To request API upload access:
1. Visit the My Apps page
2. Select the name of your app
3. On your app's information page, under the Permissions section, select the **Request Upload Access** link and fill the required information.
4. Or you can also submit a [support ticket](https://vimeo.com/help/contact) requesting Vimeo API upload access
`;

// Vimeo API authentication
export const vimeoAuth = PieceAuth.CustomAuth({
  description: authGuide,
  props: {
    accessToken: PieceAuth.SecretText({
      displayName: 'Access Token',
      description: 'Your Vimeo API Access Token',
      required: true,
    }),
  },
  required: true,
  async validate({ auth }) {
    try {
      const response = await httpClient.sendRequest({
        method: HttpMethod.GET,
        url: 'https://api.vimeo.com/me',
        authentication: {
          type: AuthenticationType.BEARER_TOKEN,
          token: auth.accessToken,
        },
      });
      return { valid: true };
    } catch (e: any) {
      return {
        valid: false,
        error: e?.message || 'Invalid Vimeo credentials',
      };
    }
  },
});