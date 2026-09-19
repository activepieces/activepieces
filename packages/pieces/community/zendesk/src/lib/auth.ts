import {
  AppConnectionType,
  AppConnectionValueForAuthProperty,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';
import { AuthenticationType, HttpHeaders } from '@activepieces/pieces-common';

const tokenAuthMarkdown = `
**Organization**: The organization name can be found in the URL (e.g https://ORGANIZATION_NAME.zendesk.com).

**Agent Email**: The email you use to log in to Zendesk.

**API Token**: You can find this in the Zendesk Admin Panel under Settings > APIs > Zendesk API.
`;

const oauth2Markdown = `
To connect Zendesk via OAuth2:
1. In Zendesk Admin Center, go to **Apps and integrations** → **Zendesk API** → **OAuth Clients**.
2. Add a new OAuth client with your redirect URL.
3. Provide your Zendesk **Subdomain**, **Client ID**, and **Client Secret**.
`;

export const zendeskAuth = [
  PieceAuth.OAuth2({
    description: oauth2Markdown,
    authUrl: 'https://{subdomain}.zendesk.com/oauth/authorizations/new',
    tokenUrl: 'https://{subdomain}.zendesk.com/oauth/tokens',
    required: true,
    props: {
      subdomain: Property.ShortText({
        displayName: 'Subdomain',
        description: 'The subdomain of your Zendesk instance (e.g. yourcompany in yourcompany.zendesk.com)',
        required: true,
      }),
    },
    scope: ['read', 'write'],
  }),
  PieceAuth.CustomAuth({
    displayName: 'API Token',
    description: tokenAuthMarkdown,
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
  }),
];

export type ZendeskAuthValue = AppConnectionValueForAuthProperty<typeof zendeskAuth>;

export const getZendeskSubdomain = (auth: ZendeskAuthValue): string => {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return auth.props.subdomain;
  }
  return (auth.props as { subdomain: string })?.subdomain ?? (auth.data as Record<string, any>)?.['subdomain'];
};

export const getZendeskAuthHeader = (auth: ZendeskAuthValue): HttpHeaders => {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    const creds = `${auth.props.email}/token:${auth.props.token}`;
    return {
      Authorization: `Basic ${Buffer.from(creds).toString('base64')}`,
    };
  }
  return {
    Authorization: `Bearer ${auth.access_token}`,
  };
};

export const getZendeskHttpClientAuth = (auth: ZendeskAuthValue) => {
  if (auth.type === AppConnectionType.CUSTOM_AUTH) {
    return {
      type: AuthenticationType.BASIC as const,
      username: `${auth.props.email}/token`,
      password: auth.props.token,
    };
  }
  return {
    type: AuthenticationType.BEARER_TOKEN as const,
    token: auth.access_token,
  };
};
