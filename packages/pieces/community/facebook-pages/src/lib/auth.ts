import { PieceAuth } from '@activepieces/pieces-framework';

const markdown = `
To Obtain a Client ID and Client Secret:

1. Go to https://developers.facebook.com/
2. Register for a Facebook Developer account.
3. Once login, click "Make a new app" button.
4. Select "Other" for use cases.
5. Choose "Business" as the type of app. 
6. Provide application details: custom name and associated email.
7. Once your application is created, you need to add a new "product".
8. Configure a new product of type "Facebook Login Settings".
9. Default settings should be fine, you only need to provide the Redirect URL in "Valid OAuth Redirect URIs" and your domain name in "Allowed Domains for the JavaScript SDK".
10. Finally, get your application ID and application secret from your app dashboard in Settings > Basic.
`;

export const facebookPagesAuth = PieceAuth.OAuth2({
  description: markdown,
  authUrl: 'https://graph.facebook.com/oauth/authorize',
  tokenUrl: 'https://graph.facebook.com/oauth/access_token',
  required: true,
  scope: [
    'pages_show_list',
    'pages_manage_posts',
    'business_management',
    'pages_read_engagement',
  ],
});
