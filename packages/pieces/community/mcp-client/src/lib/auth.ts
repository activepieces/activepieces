import { McpAuthType, McpProtocol, PieceAuth, Property } from '@activepieces/pieces-framework';

export const mcpClientAuth = PieceAuth.CustomAuth({
  description:
    'Connect to an external MCP server. Fill only the fields relevant to the chosen authentication method.',
  required: true,
  props: {
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
      description: 'Header carrying the API key, e.g. "x-api-key". Used when Authentication is "API Key".',
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
