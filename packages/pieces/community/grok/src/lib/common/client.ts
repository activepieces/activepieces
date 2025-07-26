import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export type GrokAuthProps = {
  apiKey: string;
};

export type GrokApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: QueryParams;
  body?: any;
  auth: GrokAuthProps;
};

export async function grokApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: GrokApiCallParams): Promise<T> {
  const { apiKey } = auth;

  if (!apiKey) {
    throw new Error('Grok API key is required for authentication');
  }

  const baseUrl = 'https://api.x.ai/v1';

  const request: HttpRequest = {
    method,
    url: `${baseUrl}${resourceUri}`,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    queryParams: query,
    body,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    const statusCode = error.response?.status;
    const errorData = error.response?.data;
    const errorMessage = errorData?.error?.message || error.message || 'Unknown error occurred';

    switch (statusCode) {
      case 400:
        throw new Error(
          `Bad Request: ${errorMessage}. Please check the input parameters.`
        );
      case 401:
      case 403:
        throw new Error(
          `Authentication Failed: ${errorMessage}. Please verify your API key.`
        );
      case 409:
          throw new Error(
            `Conflict: ${errorMessage}. There might be a conflict with the current state of the resource.`
          );
      case 429:
        throw new Error(
          `Rate Limit Exceeded: ${errorMessage}. You have hit the rate limit. Please wait before trying again.`
        );
      default:
        throw new Error(
          `Grok API Error (${statusCode || 'Unknown'}): ${errorMessage}`
        );
    }
  }
}
