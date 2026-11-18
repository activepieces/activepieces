import { createHash, randomBytes } from 'node:crypto';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { APIRequestContext } from '@playwright/test';
import { e2eApi, E2eSession, SeededFlow } from './api';
import { test as base } from './index';
import mcpToolEcho from './templates/mcp-tool-echo.json';

export const test = base.extend<McpServerFixtures>({
  mcpServer: async ({ request, session, seed, baseURL }, use) => {
    const instanceUrl = requireBaseUrl(baseURL);
    const grantIds: string[] = [];
    const clients: Client[] = [];
    const finishAuthorization = async ({ pending, redirect }: { pending: PendingAuthorization; redirect: URL }): Promise<McpConnection> => {
      const accessToken = await exchangeCode({ request, pending, redirect });
      const grantId = readGrantId(accessToken);
      grantIds.push(grantId);
      const client = await connectClient({ instanceUrl, pending, accessToken });
      clients.push(client);
      return { client, clientName: pending.clientName, grantId };
    };
    await use({
      startAuthorization: ({ scope }) => startAuthorization({ request, instanceUrl, scope }),
      finishAuthorization,
      connect: async ({ scope, session: projectSession }) => {
        const owner = projectSession ?? session;
        const pending = await startAuthorization({ request, instanceUrl, scope });
        const redirect = await approve({ request, instanceUrl, session: owner, pending });
        return finishAuthorization({ pending, redirect });
      },
      seedFlowTool: async () => {
        const toolDescription = e2eApi.uniqueName('echo tool');
        const flow = await seed.flow({ template: withToolDescription(toolDescription), publish: true });
        return { ...flow, toolDescription };
      },
    });
    await Promise.allSettled(clients.map((client) => client.close()));
    await revokeGrants({ request, session, grantIds });
  },

  projectMcpTools: async ({ request, session }, use) => {
    const path = `/api/v1/projects/${session.projectId}/mcp-server`;
    const readDisabledTools = async () => (await e2eApi.callApi<{ disabledTools: string[] | null }>({ request, session, method: 'GET', path })).disabledTools ?? [];
    const saved = await readDisabledTools();
    await use({ readDisabledTools });
    await e2eApi.callApi({ request, session, method: 'POST', path, data: { disabledTools: saved } });
  },
});

export { expect } from '@playwright/test';

function withToolDescription(toolDescription: string) {
  const [flow] = mcpToolEcho.flows;
  const settings = { ...flow.trigger.settings, input: { ...flow.trigger.settings.input, toolDescription } };
  return { ...mcpToolEcho, flows: [{ ...flow, trigger: { ...flow.trigger, settings } }] };
}

function requireBaseUrl(baseURL: string | undefined): string {
  if (!baseURL) {
    throw new Error('The MCP fixtures need the baseURL of playwright.config.ts');
  }
  return baseURL;
}

async function startAuthorization({ request, instanceUrl, scope }: { request: APIRequestContext; instanceUrl: string; scope: McpScope }): Promise<PendingAuthorization> {
  const clientName = e2eApi.uniqueName('MCP client');
  const registration = await request.post('/register', {
    data: {
      client_name: clientName,
      redirect_uris: [REDIRECT_URI],
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
      token_endpoint_auth_method: 'none',
    },
  });
  if (!registration.ok()) {
    throw new Error(`Registering the MCP client failed with ${registration.status()}: ${await registration.text()}`);
  }
  const { client_id: clientId }: { client_id: string } = await registration.json();
  const codeVerifier = randomBytes(32).toString('base64url');
  const state = randomBytes(8).toString('hex');
  const query = new URLSearchParams({
    client_id: clientId,
    redirect_uri: REDIRECT_URI,
    response_type: 'code',
    code_challenge: createHash('sha256').update(codeVerifier).digest('base64url'),
    code_challenge_method: 'S256',
    state,
    resource: serverUrl({ instanceUrl, scope }).toString(),
  });
  return { clientName, clientId, codeVerifier, state, scope, redirectUri: REDIRECT_URI, authorizeUrl: `/authorize?${query.toString()}` };
}

async function approve({ request, instanceUrl, session, pending }: { request: APIRequestContext; instanceUrl: string; session: E2eSession; pending: PendingAuthorization }): Promise<URL> {
  const authorize = await request.get(pending.authorizeUrl, { maxRedirects: 0 });
  const consentPage = authorize.headers()['location'];
  if (authorize.status() !== 302 || !consentPage) {
    throw new Error(`GET /authorize answered ${authorize.status()} instead of a redirect to the consent page: ${await authorize.text()}`);
  }
  const authRequestId = new URL(consentPage, instanceUrl).searchParams.get('authRequestId');
  const { redirectUrl } = await e2eApi.callApi<{ redirectUrl: string }>({
    request,
    session,
    method: 'POST',
    path: '/api/v1/mcp-oauth/approve',
    data: { authRequestId, ...(pending.scope === 'project' ? { projectId: session.projectId } : {}) },
  });
  return new URL(redirectUrl);
}

async function exchangeCode({ request, pending, redirect }: { request: APIRequestContext; pending: PendingAuthorization; redirect: URL }): Promise<string> {
  const code = redirect.searchParams.get('code');
  if (!code || redirect.searchParams.get('state') !== pending.state) {
    throw new Error(`The consent redirect carries no code or the wrong state: ${redirect.search}`);
  }
  const token = await request.post('/token', {
    form: {
      grant_type: 'authorization_code',
      code,
      code_verifier: pending.codeVerifier,
      redirect_uri: REDIRECT_URI,
      client_id: pending.clientId,
    },
  });
  if (!token.ok()) {
    throw new Error(`Exchanging the code failed with ${token.status()}: ${await token.text()}`);
  }
  const { access_token: accessToken }: { access_token: string } = await token.json();
  return accessToken;
}

async function connectClient({ instanceUrl, pending, accessToken }: { instanceUrl: string; pending: PendingAuthorization; accessToken: string }): Promise<Client> {
  const client = new Client({ name: pending.clientName, version: '1.0.0' });
  await client.connect(new StreamableHTTPClientTransport(serverUrl({ instanceUrl, scope: pending.scope }), {
    requestInit: { headers: { Authorization: `Bearer ${accessToken}` } },
  }));
  return client;
}

function readGrantId(accessToken: string): string {
  const [, payload] = accessToken.split('.');
  const claims: { grantId?: unknown } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8'));
  if (typeof claims.grantId !== 'string') {
    throw new Error('The MCP access token carries no grantId claim');
  }
  return claims.grantId;
}

async function revokeGrants({ request, session, grantIds }: { request: APIRequestContext; session: E2eSession; grantIds: string[] }) {
  if (grantIds.length === 0) {
    return;
  }
  const status = await e2eApi.callApiStatus({ request, session, method: 'POST', path: '/api/v1/mcp-oauth/grants/revoke', data: { ids: grantIds } });
  if (status !== 204) {
    throw new Error(`Revoking the MCP grants of the test failed with ${status}`);
  }
}

function serverUrl({ instanceUrl, scope }: { instanceUrl: string; scope: McpScope }): URL {
  return new URL(scope === 'platform' ? '/mcp/platform' : '/mcp', instanceUrl);
}

const REDIRECT_URI = 'http://127.0.0.1:43117/callback';

export type McpScope = 'project' | 'platform';

export type McpConnection = { client: Client; clientName: string; grantId: string };

export type PendingAuthorization = {
  clientName: string;
  clientId: string;
  codeVerifier: string;
  state: string;
  scope: McpScope;
  redirectUri: string;
  authorizeUrl: string;
};

type McpServerFixtures = {
  mcpServer: {
    startAuthorization: (params: { scope: McpScope }) => Promise<PendingAuthorization>;
    finishAuthorization: (params: { pending: PendingAuthorization; redirect: URL }) => Promise<McpConnection>;
    connect: (params: { scope: McpScope; session?: E2eSession }) => Promise<McpConnection>;
    seedFlowTool: () => Promise<SeededFlow & { toolDescription: string }>;
  };
  projectMcpTools: { readDisabledTools: () => Promise<string[]> };
};
