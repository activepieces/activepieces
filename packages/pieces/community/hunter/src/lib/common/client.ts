import { httpClient, HttpMethod, HttpRequest, AuthenticationType } from '@activepieces/pieces-common';

export const BASE_URL = 'https://api.hunter.io/v2';

export interface HunterApiCallParams {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  body?: Record<string, any>;
  queryParams?: Record<string, any>;
}

export async function hunterApiCall(params: HunterApiCallParams): Promise<any> {
  const { apiKey, method, resourceUri, body, queryParams = {} } = params;

  const finalQueryParams = {
    ...queryParams,
    api_key: apiKey,
  };

  const request: HttpRequest = {
    method,
    url: `${BASE_URL}${resourceUri}`,
    headers: {
      'Content-Type': 'application/json',
      'X-API-KEY': apiKey,
    },
    queryParams: finalQueryParams,
  };

  if (body && (method === HttpMethod.POST || method === HttpMethod.PUT || method === HttpMethod.PATCH)) {
    request.body = body;
  }

  try {
    const response = await httpClient.sendRequest(request);
    return response.body;
  } catch (error: any) {
    const status = error.response?.status;
    const errorBody = error.response?.body;

    if (status === 400) {
      if (errorBody?.errors && Array.isArray(errorBody.errors)) {
        const errorDetails = errorBody.errors.map((err: any) => {
          if (err.details) return err.details;
          if (err.id) return err.id;
          return String(err);
        }).join(', ');
        throw new Error(`Bad request: ${errorDetails}`);
      }
      throw new Error('Your request was not valid. It was missing a required parameter or a supplied parameter was invalid.');
    }

    if (status === 401) {
      throw new Error('No valid API key was provided.');
    }

    if (status === 403) {
      throw new Error('You have reached the rate limit.');
    }

    if (status === 404) {
      throw new Error('The requested resource does not exist.');
    }

    if (status === 422) {
      if (errorBody?.errors && Array.isArray(errorBody.errors)) {
        const errorDetails = errorBody.errors.map((err: any) => {
          if (err.details) return err.details;
          if (err.id) return err.id;
          return String(err);
        }).join(', ');
        throw new Error(`Unprocessable entity: ${errorDetails}`);
      }
      throw new Error('Your request is valid but the creation of the resource failed. Check the errors.');
    }

    if (status === 429) {
      throw new Error('You have reached your usage limit. Upgrade your plan if necessary.');
    }

    if (status >= 500) {
      throw new Error('Something went wrong on Hunter\'s end.');
    }

    throw new Error(`API call failed: ${error.message || 'Unknown error'}`);
  }
} 