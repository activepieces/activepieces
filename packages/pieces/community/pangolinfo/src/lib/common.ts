import { HttpMethod, httpClient } from '@activepieces/pieces-common';

const API_BASE_URL = 'https://scrapeapi.pangolinfo.com';
const MCP_URL = 'https://mcp.pangolinfo.com/mcp';

async function request({
  apiKey,
  method,
  path,
  body,
}: PangolinfoRequest): Promise<unknown> {
  const response = await httpClient.sendRequest({
    method,
    url: `${API_BASE_URL}${path}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'pangolinfo-activepieces/0.1.0',
    },
    body,
    timeout: 90000,
  });
  return response.body;
}

async function validateKey(apiKey: string): Promise<void> {
  await httpClient.sendRequest({
    method: HttpMethod.POST,
    url: MCP_URL,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2025-03-26',
        capabilities: {},
        clientInfo: { name: 'pangolinfo-activepieces', version: '0.1.0' },
      },
    },
    timeout: 30000,
  });
}

const pangolinfoClient = { request, validateKey };

export { pangolinfoClient };

type PangolinfoRequest = {
  apiKey: string;
  method: HttpMethod;
  path: string;
  body: unknown;
};
