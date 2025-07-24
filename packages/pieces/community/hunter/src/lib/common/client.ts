import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
  AuthenticationType,
  HttpError,
} from '@activepieces/pieces-common';

export type HunterAuthProps = {
  apiKey: string;
};

export type HunterApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: unknown;
  auth: HunterAuthProps;
};

export async function hunterIoApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: HunterApiCallParams): Promise<T> {
  const queryParams: QueryParams = {};
  
  // Convert query params to strings as required by QueryParams type
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        queryParams[key] = Array.isArray(value) ? value.join(',') : String(value);
      }
    });
  }
  
  queryParams['api_key'] = auth.apiKey;

  const request: HttpRequest = {
    method,
    url: `https://api.hunter.io/v2${resourceUri}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.apiKey,
    },
    queryParams,
    body,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error) {
    const httpError = error as HttpError;
    const errorBody = httpError.response?.body as { errors?: Array<{ details: string }> };
    const errorMessage = errorBody?.errors?.[0]?.details || 'Unknown error';

    switch (httpError.response?.status) {
      case 400:
        throw new Error(`Bad Request: ${errorMessage}. Please check your input.`);
      case 401:
      case 403:
        throw new Error(`Authentication Failed: ${errorMessage}. Please check your API key and plan permissions.`);
      case 409:
        throw new Error(`Conflict: ${errorMessage}. The resource may already exist or there's a conflict with the current state.`);
      case 429:
        throw new Error(`Rate Limit Exceeded: ${errorMessage}. Please wait and try again later.`);
      default:
        throw new Error(`Hunter.io API Error: ${errorMessage} (Status: ${httpError.response?.status || 'N/A'})`);
    }
  }
}
