import { ExtractedAuth, OpenAPISpec } from './types';

export const authExtractor = { extract };

function extract({ spec }: { spec: OpenAPISpec }): ExtractedAuth {
  const schemes = spec.components?.securitySchemes;
  if (!schemes || Object.keys(schemes).length === 0) return { kind: 'none' };

  const [, scheme] = Object.entries(schemes)[0];

  if (scheme.type === 'apiKey') {
    const location = scheme.in ?? 'header';
    return {
      kind: 'apiKey',
      location: location as 'header' | 'query' | 'cookie',
      headerName: scheme.name ?? 'X-API-Key',
    };
  }

  if (scheme.type === 'http') {
    if (scheme.scheme === 'basic') return { kind: 'basic' };
    return { kind: 'bearer' };
  }

  if (scheme.type === 'oauth2') {
    const flow =
      scheme.flows?.authorizationCode ??
      scheme.flows?.clientCredentials ??
      scheme.flows?.implicit;

    if (!flow) return { kind: 'bearer' };

    const authUrl = 'authorizationUrl' in flow ? flow.authorizationUrl : '';
    const tokenUrl = 'tokenUrl' in flow ? flow.tokenUrl : '';
    const scopes = Object.keys(flow.scopes ?? {});

    return { kind: 'oauth2', authUrl, tokenUrl, scopes };
  }

  return { kind: 'none' };
}
