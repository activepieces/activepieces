import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  AuthenticationType
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { respondIoAuth } from './auth';

export type RespondIoApiCallParams = {
  method: HttpMethod;
  url: string;
  body?: unknown;
  auth: PiecePropValueSchema<typeof respondIoAuth>;
};

export async function respondIoApiCall<T extends HttpMessageBody>({
  method,
  url,
  body,
  auth
}: RespondIoApiCallParams): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `https://api.respond.io/v2${url}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.token
    },
    headers: {
      'Content-Type': 'application/json',
      accept: 'application/json'
    },
    body
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (error: unknown) {
    const err = error as {
      response?: {
        status?: number;
        body?: { message?: string };
      };
      message?: string;
    };

    const status = err.response?.status;
    const apiMessage = err.response?.body?.message || 'No details provided';

    // Provide specific, user-friendly error messages based on status codes
    switch (status) {
      case 400:
        throw new Error(
          `Bad Request: The request format is incorrect or missing required data. Please check your input values. Details: ${apiMessage}`
        );
      case 401:
        throw new Error(
          `Authentication Error: Your API token is invalid or expired. Please check your Respond.io API token in the connection settings. Details: ${apiMessage}`
        );
      case 403:
        throw new Error(
          `Access Forbidden: Your API token doesn't have permission for this operation. Please check your Respond.io account permissions. Details: ${apiMessage}`
        );
      case 404:
        throw new Error(
          `Resource Not Found: The requested contact, conversation, or resource doesn't exist in your Respond.io workspace. Details: ${apiMessage}`
        );
      case 409:
        throw new Error(
          `Conflict: The resource already exists or there's a data conflict. This often happens when trying to create a contact with an existing identifier. Details: ${apiMessage}`
        );
      case 429:
        throw new Error(
          `Rate Limit Exceeded: Too many requests to Respond.io API. Please wait a moment before trying again. Details: ${apiMessage}`
        );
      case 449:
        throw new Error(
          `Request Failed: The request could not be completed. This may be a temporary issue with Respond.io services. Please try again later. Details: ${apiMessage}`
        );
      case 500:
        throw new Error(
          `Server Error: Respond.io is experiencing technical difficulties. Please try again later or contact Respond.io support. Details: ${apiMessage}`
        );
      default: {
        const fallbackMessage = err.message || 'Unknown error occurred';
        throw new Error(
          `Respond.io API Error (Status ${status || 'Unknown'}): ${
            apiMessage || fallbackMessage
          }`
        );
      }
    }
  }
}
