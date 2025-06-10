import { httpClient, HttpMethod } from '@activepieces/pieces-common';
import { HttpStatusCode } from 'axios';

const SKYVERN_API_BASE_URL = 'https://api.skyvern.com/v1';

export const makeClient = (
  apiKey: string,
  xUserAgent?: string,
  xMaxStepsOverride?: number
) => {
  const commonHeaders: Record<string, string> = {
    'x-api-key': apiKey,
    'Content-Type': 'application/json',
  };

  if (xUserAgent) {
    commonHeaders['x-user-agent'] = xUserAgent;
  }
  if (xMaxStepsOverride !== undefined && xMaxStepsOverride !== null) {
    commonHeaders['x-max-steps-override'] = xMaxStepsOverride.toString();
  }
  return {
    tasks: {
      create: async (data: Record<string, unknown>) => {
        const response = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `${SKYVERN_API_BASE_URL}/run/tasks`,
          headers: commonHeaders,
          body: data,
        });
        if (response.status === HttpStatusCode.Ok) {
          return response.body;
        }
        throw new Error(
          `Failed to create task. Status: ${
            response.status
          }, Response: ${JSON.stringify(response.body)}`
        );
      },
    },
    runs: {
      get: async (runId: string) => {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${SKYVERN_API_BASE_URL}/runs/${runId}`,
          headers: commonHeaders,
        });
        if (response.status === HttpStatusCode.Ok) {
          return response.body;
        }
        throw new Error(
          `Failed to get run info. Status: ${
            response.status
          }, Response: ${JSON.stringify(response.body)}`
        );
      },
      cancel: async (runId: string) => {
        const response = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `${SKYVERN_API_BASE_URL}/runs/${runId}/cancel`,
          headers: commonHeaders,
          body: {},
        });
        if (
          response.status === HttpStatusCode.Ok ||
          response.status === HttpStatusCode.NoContent
        ) {
          return {
            success: true,
            message: `Run ${runId} cancelled successfully.`,
          };
        }
        throw new Error(
          `Failed to cancel run. Status: ${
            response.status
          }, Response: ${JSON.stringify(response.body)}`
        );
      },
    },
    workflows: {
      list: async (queryParams: Record<string, unknown>) => {
        const queryString = Object.keys(queryParams)
          .filter((key) => queryParams[key] !== undefined)
          .map((key) => {
            const value = queryParams[key];
            if (
              typeof value === 'string' ||
              typeof value === 'number' ||
              typeof value === 'boolean'
            ) {
              return `${key}=${encodeURIComponent(value)}`;
            }
            return `${key}=${encodeURIComponent(String(value))}`;
          })
          .join('&');
        const url = `${SKYVERN_API_BASE_URL}/workflows${
          queryString ? `?${queryString}` : ''
        }`;

        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: url,
          headers: commonHeaders,
        });
        if (response.status === HttpStatusCode.Ok) {
          return response.body;
        }
        throw new Error(
          `Failed to list workflows. Status: ${
            response.status
          }, Response: ${JSON.stringify(response.body)}`
        );
      },
      run: async (data: Record<string, unknown>) => {
        const response = await httpClient.sendRequest({
          method: HttpMethod.POST,
          url: `${SKYVERN_API_BASE_URL}/workflows/run`,
          headers: commonHeaders,
          body: data,
        });
        if (response.status === HttpStatusCode.Ok) {
          return response.body;
        }
        throw new Error(
          `Failed to run workflow. Status: ${
            response.status
          }, Response: ${JSON.stringify(response.body)}`
        );
      },
      get: async (workflowId: string) => {
        const response = await httpClient.sendRequest({
          method: HttpMethod.GET,
          url: `${SKYVERN_API_BASE_URL}/workflows/${workflowId}`, 
          headers: commonHeaders,
        });
        if (response.status === HttpStatusCode.Ok) {
          return response.body;
        }
        throw new Error(
          `Failed to get workflow. Status: ${
            response.status
          }, Response: ${JSON.stringify(response.body)}`
        );
      },
    },
  };
};
