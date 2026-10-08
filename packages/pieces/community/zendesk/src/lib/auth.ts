import { PieceAuth, Property } from '@activepieces/pieces-framework';

const customAuthMarkdown = `
**Organization**: The organization name can be found in the URL (e.g https://ORGANIZATION_NAME.zendesk.com).

**Agent Email**: The email you use to log in to Zendesk.

**API Token**: You can find this in the Zendesk Admin Panel under Settings > APIs > Zendesk API.

Zendesk is retiring API tokens — see [Zendesk's migration timeline](https://developer.zendesk.com/documentation/authentication/oauth-migration/#migration-timeline). Consider using the OAuth2 connection type instead.
`;

export const zendeskCustomAuth = PieceAuth.CustomAuth({
  displayName: 'API Token',
  description: customAuthMarkdown,
  props: {
    email: Property.ShortText({
      displayName: 'Agent Email',
      description: 'The email address you use to login to Zendesk',
      required: true,
    }),
    token: Property.ShortText({
      displayName: 'Token',
      description: 'The API token you can generate in Zendesk',
      required: true,
    }),
    subdomain: Property.ShortText({
      displayName: 'Organization (e.g activepieceshelp)',
      description: 'The subdomain of your Zendesk instance',
      required: true,
    }),
  },
  required: true,
});

const oauth2Markdown = `
To connect with OAuth2, create an OAuth client in your Zendesk account:

1. Go to **Admin Center > Apps and integrations > APIs > OAuth clients**.
2. Click **Add OAuth client**, give it a name, and set **Client kind** to **Confidential**.
3. Set **Redirect URL** to the redirect URL shown below.
4. Save, then copy the generated **Client ID** and **Secret** into the fields below.
`;

export const zendeskOAuth2Auth = PieceAuth.OAuth2({
  description: oauth2Markdown,
  props: {
    subdomain: Property.ShortText({
      displayName: 'Organization (e.g activepieceshelp)',
      description: 'The organization name can be found in the URL (e.g https://ORGANIZATION_NAME.zendesk.com).',
      required: true,
    }),
  },
  authUrl: 'https://{subdomain}.zendesk.com/oauth/authorizations/new',
  tokenUrl: 'https://{subdomain}.zendesk.com/oauth/tokens',
  scope: ['read', 'write'],
  pkce: true,
  pkceMethod: 'S256',
  required: true,
});

export const zendeskAuth = [zendeskCustomAuth, zendeskOAuth2Auth];
