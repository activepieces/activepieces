import { ExtractedAuth, GeneratorContext } from '../types';

export function generateCommon({ ctx }: { ctx: GeneratorContext }): string {
  const { auth, baseUrl } = ctx.spec;
  const camel = toCamelCase(ctx.pieceName);
  const clientVarName = `${camel}ApiClient`;

  const { importLine, authParamType } = buildAuthImport(auth);
  const headersFn = buildHeadersFn({ auth, authParamType });
  const hasAuth = auth.kind !== 'none';

  return `import { httpClient, HttpMethod } from '@activepieces/pieces-common';
${importLine}
export const ${clientVarName} = { get: getRequest, post: postRequest, put: putRequest, patch: patchRequest, delete: deleteRequest };

async function getRequest({ auth, endpoint, queryParams }: GetParams) {
  const url = new URL(\`\${BASE_URL}\${endpoint}\`);
  if (queryParams) {
    for (const [key, value] of Object.entries(queryParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return httpClient.sendRequest({
    method: HttpMethod.GET,
    url: url.toString(),
    headers: ${hasAuth ? 'buildHeaders(auth)' : '{}'},
  });
}

async function postRequest({ auth, endpoint, body }: WriteParams) {
  return httpClient.sendRequest({
    method: HttpMethod.POST,
    url: \`\${BASE_URL}\${endpoint}\`,
    headers: ${hasAuth ? 'buildHeaders(auth)' : "{ 'Content-Type': 'application/json' }"},
    body,
  });
}

async function putRequest({ auth, endpoint, body }: WriteParams) {
  return httpClient.sendRequest({
    method: HttpMethod.PUT,
    url: \`\${BASE_URL}\${endpoint}\`,
    headers: ${hasAuth ? 'buildHeaders(auth)' : "{ 'Content-Type': 'application/json' }"},
    body,
  });
}

async function patchRequest({ auth, endpoint, body }: WriteParams) {
  return httpClient.sendRequest({
    method: HttpMethod.PATCH,
    url: \`\${BASE_URL}\${endpoint}\`,
    headers: ${hasAuth ? 'buildHeaders(auth)' : "{ 'Content-Type': 'application/json' }"},
    body,
  });
}

async function deleteRequest({ auth, endpoint }: DeleteParams) {
  return httpClient.sendRequest({
    method: HttpMethod.DELETE,
    url: \`\${BASE_URL}\${endpoint}\`,
    headers: ${hasAuth ? 'buildHeaders(auth)' : '{}'},
  });
}

${headersFn}
const BASE_URL = '${baseUrl}';

${hasAuth ? buildParamTypes({ authParamType }) : buildNoAuthParamTypes()}`;
}

function buildAuthImport(auth: ExtractedAuth): { importLine: string; authParamType: string } {
  switch (auth.kind) {
    case 'oauth2':
      return {
        importLine: "import { OAuth2ConnectionValueWithApp } from '@activepieces/shared';",
        authParamType: 'OAuth2ConnectionValueWithApp',
      };
    case 'bearer':
    case 'apiKey':
      return {
        importLine: "import { SecretTextConnectionValue } from '@activepieces/shared';",
        authParamType: 'SecretTextConnectionValue',
      };
    case 'basic':
      return {
        importLine: "import { BasicAuthConnectionValue } from '@activepieces/shared';",
        authParamType: 'BasicAuthConnectionValue',
      };
    case 'none':
      return { importLine: '', authParamType: 'never' };
  }
}

function buildHeadersFn({ auth, authParamType }: { auth: ExtractedAuth; authParamType: string }): string {
  switch (auth.kind) {
    case 'apiKey':
      if (auth.location === 'header') {
        return `function buildHeaders(auth: ${authParamType}) {
  return {
    '${auth.headerName}': auth.secret_text,
    'Content-Type': 'application/json',
  };
}`;
      }
      return `function buildHeaders(_auth: ${authParamType}) {
  return { 'Content-Type': 'application/json' };
}`;

    case 'bearer':
      return `function buildHeaders(auth: ${authParamType}) {
  return {
    'Authorization': \`Bearer \${auth.secret_text}\`,
    'Content-Type': 'application/json',
  };
}`;

    case 'basic':
      return `function buildHeaders(auth: ${authParamType}) {
  const encoded = Buffer.from(\`\${auth.username}:\${auth.password}\`).toString('base64');
  return {
    'Authorization': \`Basic \${encoded}\`,
    'Content-Type': 'application/json',
  };
}`;

    case 'oauth2':
      return `function buildHeaders(auth: ${authParamType}) {
  return {
    'Authorization': \`Bearer \${auth.access_token}\`,
    'Content-Type': 'application/json',
  };
}`;

    case 'none':
      return '';
  }
}

function buildParamTypes({ authParamType }: { authParamType: string }): string {
  return `type GetParams = { auth: ${authParamType}; endpoint: string; queryParams?: Record<string, unknown> };
type WriteParams = { auth: ${authParamType}; endpoint: string; body: Record<string, unknown> };
type DeleteParams = { auth: ${authParamType}; endpoint: string };`;
}

function buildNoAuthParamTypes(): string {
  return `type GetParams = { auth?: never; endpoint: string; queryParams?: Record<string, unknown> };
type WriteParams = { auth?: never; endpoint: string; body: Record<string, unknown> };
type DeleteParams = { auth?: never; endpoint: string };`;
}

function toPascalCase(kebab: string): string {
  const result = kebab.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join('');
  return /^[0-9]/.test(result) ? `P${result}` : result;
}

function toCamelCase(kebab: string): string {
  const p = toPascalCase(kebab);
  return p.charAt(0).toLowerCase() + p.slice(1);
}
