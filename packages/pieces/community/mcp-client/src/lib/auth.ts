import {
  McpAuthType,
  McpProtocol,
  OAuth2GrantType,
  PieceAuth,
  Property,
} from '@activepieces/pieces-framework';

function serverConnectionProps() {
  return {
    serverUrl: Property.ShortText({
      displayName: 'Server URL',
      description: 'The MCP server endpoint, e.g. https://example.com/mcp',
      required: true,
    }),
    protocol: Property.StaticDropdown({
      displayName: 'Transport',
      required: true,
      defaultValue: McpProtocol.STREAMABLE_HTTP,
      options: {
        options: [
          { label: 'Streamable HTTP', value: McpProtocol.STREAMABLE_HTTP },
          { label: 'HTTP', value: McpProtocol.SIMPLE_HTTP },
          { label: 'SSE (deprecated)', value: McpProtocol.SSE },
        ],
      },
    }),
  };
}

export const mcpClientAuth = PieceAuth.CustomAuth({
  displayName: 'API Key / Headers',
  description:
    'Connect to an external MCP server. Fill only the fields relevant to the chosen authentication method.',
  required: true,
  props: {
    ...serverConnectionProps(),
    authType: Property.StaticDropdown({
      displayName: 'Authentication',
      required: true,
      defaultValue: McpAuthType.NONE,
      options: {
        options: [
          { label: 'None', value: McpAuthType.NONE },
          { label: 'Bearer Token', value: McpAuthType.ACCESS_TOKEN },
          { label: 'API Key', value: McpAuthType.API_KEY },
          { label: 'Custom Headers', value: McpAuthType.HEADERS },
        ],
      },
    }),
    accessToken: PieceAuth.SecretText({
      displayName: 'Bearer Token',
      description: 'Used when Authentication is "Bearer Token".',
      required: false,
    }),
    apiKey: PieceAuth.SecretText({
      displayName: 'API Key',
      description: 'Used when Authentication is "API Key".',
      required: false,
    }),
    apiKeyHeader: Property.ShortText({
      displayName: 'API Key Header Name',
      description:
        'Header carrying the API key, e.g. "x-api-key". Used when Authentication is "API Key".',
      required: false,
    }),
    headers: Property.LongText({
      displayName: 'Custom Headers',
      description:
        'A JSON object of header name/value pairs, e.g. {"x-tenant": "acme"}. Used when Authentication is "Custom Headers".',
      required: false,
    }),
  },
});

export const mcpOAuth2Auth = PieceAuth.OAuth2({
  displayName: 'OAuth2',
  description: `Connect to an external MCP server that authenticates via OAuth2.

Enter the server URL and click Connect — the OAuth2 endpoints are read from the server's own metadata and a client is registered automatically.

If the server doesn't publish that metadata, or doesn't support Dynamic Client Registration, the fields to fill in by hand appear instead.`,
  authUrl: '{authUrl}',
  tokenUrl: '{tokenUrl}',
  required: true,
  scope: '{scopes}'.split(' '),
  grantType: OAuth2GrantType.AUTHORIZATION_CODE,
  pkce: true,
  pkceMethod: 'S256',
  discovery: {
    serverUrlProp: 'serverUrl',
    authUrlProp: 'authUrl',
    tokenUrlProp: 'tokenUrl',
    scopesProp: 'scopes',
  },
  props: {
    ...serverConnectionProps(),
    authUrl: Property.ShortText({
      displayName: 'Authorize URL',
      required: true,
      description: "The authorization server's `authorization_endpoint`.",
    }),
    tokenUrl: Property.ShortText({
      displayName: 'Token URL',
      required: true,
      description: "The authorization server's `token_endpoint`.",
    }),
    scopes: Property.ShortText({
      displayName: 'Scopes (whitespace separated)',
      required: false,
      description:
        "The authorization server's `scopes_supported`, if it requires specific scopes.",
    }),
  },
});

export const mcpAuth = [mcpClientAuth, mcpOAuth2Auth];
