import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  QueryParams,
} from '@activepieces/pieces-common';

export type WufooAuthProps = {
  apiKey: string;
  subdomain: string;
};

export type WufooApiCallParams = {
  method: HttpMethod;
  resourceUri: string;
  query?: Record<string, string | number | string[] | undefined>;
  body?: any;
  auth: WufooAuthProps;
};

export async function wufooApiCall<T extends HttpMessageBody>({
  method,
  resourceUri,
  query,
  body,
  auth,
}: WufooApiCallParams): Promise<T> {
  const { apiKey, subdomain } = auth;

  if (!apiKey || !subdomain) {
    throw new Error('Wufoo API key and subdomain are required for authentication');
  }

  const queryParams: QueryParams = {};

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined) {
        queryParams[key] = String(value);
      }
    }
  }

  const baseUrl = `https://${subdomain}.wufoo.com/api/v3`;

  const authHeader = `Basic ${Buffer.from(`${apiKey}:footastic`).toString('base64')}`;

  const request: HttpRequest = {
    method,
    url: `${baseUrl}${resourceUri}`,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/x-www-form-urlencoded',
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
          `Bad Request: ${errorData?.Text || 'Invalid request parameters'}. Please check your form data and field values.`
        );

      case 401:
        throw new Error(
          'Authentication Failed: Invalid API key or subdomain. Please verify your Wufoo credentials in the connection settings.'
        );

      case 403:
        throw new Error(
          'Access Forbidden: You do not have permission to access this resource. Please check your Wufoo account permissions.'
        );

      case 404:
        throw new Error(
          'Resource Not Found: The requested form or resource does not exist. Please verify the form identifier is correct.'
        );

      case 429:
        throw new Error(
          'Rate Limit Exceeded: Too many requests in a short time period. Wufoo allows maximum 50 submissions per user in a 5-minute window. Please wait before trying again.'
        );

      case 500:
        throw new Error(
          'Internal Server Error: Wufoo is experiencing technical difficulties. Please try again later or contact Wufoo support.'
        );

      case 502:
      case 503:
      case 504:
        throw new Error(
          'Service Unavailable: Wufoo service is temporarily unavailable. Please try again in a few minutes.'
        );

      default: {
        let errorMessage = 'Unknown error occurred';
        if (errorData?.Text) {
          errorMessage = errorData.Text;
        } else if (errorData?.ErrorText) {
          errorMessage = errorData.ErrorText;
        } else if (error.message) {
          errorMessage = error.message;
        }

        throw new Error(
          `Wufoo API Error (${statusCode || 'Unknown'}): ${errorMessage}`
        );
      }
    }
  }
}
