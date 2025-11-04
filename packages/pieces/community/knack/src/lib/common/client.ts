import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export type KnackAuthProps = {
  apiKey: string;
  applicationId: string;
};

export type KnackApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: KnackAuthProps;
};

export async function knackApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: KnackApiCallParams): Promise<T> {
  const { apiKey, applicationId } = auth;

  if (!apiKey || !applicationId) {
    throw new Error('Knack API key and Application ID are required for authentication');
  }

  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }

  const baseUrl = 'https://api.knack.com/v1';

  const request: HttpRequest = {
    method,
    url: `${baseUrl}${resourceUri}`,
    headers: {
      'X-Knack-Application-ID': applicationId,
      'X-Knack-REST-API-Key': apiKey,
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

    switch (statusCode) {
      case 400:
        throw new Error(
          `Bad Request: ${errorData?.message || 'Invalid request parameters'}. Please check your data and field values.`
        );

      case 401:
        throw new Error(
          'Authentication Failed: Invalid API key or Application ID. Please verify your Knack credentials in the connection settings.'
        );

      case 403:
        throw new Error(
          'Access Forbidden: You do not have permission to access this resource. Please check your Knack account permissions.'
        );

      case 404:
        throw new Error(
          'Resource Not Found: The requested object or resource does not exist. Please verify the identifier is correct.'
        );
        
      case 429:
        throw new Error(
            'Rate Limit Exceeded: Too many requests in a short time period. Please wait before trying again.'
        );

      case 500:
        throw new Error(
          'Internal Server Error: Knack is experiencing technical difficulties. Please try again later or contact Knack support.'
        );

      case 502:
      case 503:
      case 504:
        throw new Error(
          'Service Unavailable: Knack service is temporarily unavailable. Please try again in a few minutes.'
        );

      default:
        {
                  const errorMessage = errorData?.message ||
                             error.message ||
                             'Unknown error occurred';

        throw new Error(
          `Knack API Error (${statusCode || 'Unknown'}): ${errorMessage}`
        );
        }


    }
  }
}