import {
  httpClient,
  HttpMethod,
  HttpRequest,
} from '@activepieces/pieces-common';

export function extractApiKey(auth: unknown): string {
  if (typeof auth === 'string') return auth;
  return String(auth);
}

const BASE_URL = 'https://stitch.googleapis.com/mcp';

async function callStitchTool<T>(
  apiKey: string,
  toolName: string,
  toolArgs: Record<string, unknown>
): Promise<T> {
  const request: HttpRequest = {
    method: HttpMethod.POST,
    url: `${BASE_URL}/call-tool`,
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: {
      name: toolName,
      arguments: toolArgs,
    },
  };

  const response = await httpClient.sendRequest<StitchToolResponse<T>>(request);
  return response.body.result;
}

async function listStitchTools(apiKey: string): Promise<StitchToolDefinition[]> {
  const request: HttpRequest = {
    method: HttpMethod.GET,
    url: `${BASE_URL}/list-tools`,
    headers: {
      'x-api-key': apiKey,
    },
  };

  const response =
    await httpClient.sendRequest<{ tools: StitchToolDefinition[] }>(request);
  return response.body.tools;
}

export const stitchClient = { callStitchTool, listStitchTools };

export const STITCH_BASE_URL = BASE_URL;

type StitchToolResponse<T> = {
  result: T;
};

type StitchToolDefinition = {
  name: string;
  description: string;
};
