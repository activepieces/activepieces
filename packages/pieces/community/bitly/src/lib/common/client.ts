import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export type BitlyAuthProps = {
  accessToken: string;
};

export type BitlyApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: BitlyAuthProps;
};

export async function bitlyApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: BitlyApiCallParams): Promise<T> {
  const { accessToken } = auth;

  if (!accessToken) {
    throw new Error('Bitly Access Token is required for authentication');
  }

  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }

  const baseUrl = 'https://api-ssl.bitly.com/v4';

  const request: HttpRequest = {
    method,
    url: `${baseUrl}${resourceUri}`,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    queryParams,
    body,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: any) {
    const statusCode = error.response?.status;
    const errorData = error.response?.data;
    const errorMessage = errorData?.description || errorData?.message || 'Unknown error occurred';

    switch (statusCode) {
      case 400:
        throw new Error(
          `Bad Request: ${errorMessage}. Please check your input parameters.`
        );

      case 401:
        throw new Error(
          'Authentication Failed: Invalid Access Token. Please verify your Bitly credentials in the connection settings.'
        );

      case 402:
        throw new Error(
            `Payment Required: ${errorMessage}. Your account has been suspended or you have reached a usage limit.`
        );

      case 403:
        throw new Error(
          `Access Forbidden: ${errorMessage}. You do not have permission to access this resource.`
        );

      case 404:
        throw new Error(
          `Resource Not Found: ${errorMessage}. The requested resource does not exist.`
        );

      case 417:
          throw new Error(
              `Expectation Failed: ${errorMessage}. You must agree to the latest terms of service.`
          );

      case 422:
        throw new Error(
            `Unprocessable Entity: ${errorMessage}. The request was well-formed but was unable to be followed due to semantic errors.`
        );

      case 429:
        throw new Error(
          `Rate Limit Exceeded: ${errorMessage}. Too many requests. Please wait before trying again.`
        );

      case 500:
        throw new Error(
          'Internal Server Error: Bitly is experiencing technical difficulties. Please try again later.'
        );
        
      case 503:
        throw new Error(
          'Service Unavailable: Bitly service is temporarily unavailable. Please try again in a few minutes.'
        );

      default:
        throw new Error(
          `Bitly API Error (${statusCode || 'Unknown'}): ${errorMessage}`
        );
    }
  }
}
