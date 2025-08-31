import {
  httpClient,
  HttpMethod,
  HttpRequest,
  HttpMessageBody,
  AuthenticationType
} from '@activepieces/pieces-common';
import { PiecePropValueSchema } from '@activepieces/pieces-framework';
import { retellAiAuth } from './auth';

export type RetellAiApiCallParams = {
  method: HttpMethod;
  url: string;
  body?: unknown;
  auth: PiecePropValueSchema<typeof retellAiAuth>;
};

export async function retellAiApiCall<T extends HttpMessageBody>({
  method,
  url,
  body,
  auth
}: RetellAiApiCallParams): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `https://api.retellai.com${url}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.apiKey
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
          `Authentication Error: Your API key is invalid or expired. Please check your Retell AI API key in the connection settings. Details: ${apiMessage}`
        );
      case 403:
        throw new Error(
          `Access Forbidden: Your API key doesn't have permission for this operation. Please check your Retell AI account permissions. Details: ${apiMessage}`
        );
      case 404:
        throw new Error(
          `Resource Not Found: The requested resource doesn't exist in your Retell AI account. Details: ${apiMessage}`
        );
      case 409:
        throw new Error(
          `Conflict: The resource already exists or there's a data conflict. Details: ${apiMessage}`
        );
      case 429:
        throw new Error(
          `Rate Limit Exceeded: Too many requests to Retell AI API. Please wait a moment before trying again. Details: ${apiMessage}`
        );
      case 500:
        throw new Error(
          `Server Error: Retell AI is experiencing technical difficulties. Please try again later or contact Retell AI support. Details: ${apiMessage}`
        );
      default: {
        const fallbackMessage = err.message || 'Unknown error occurred';
        throw new Error(
          `Retell AI API Error (Status ${status || 'Unknown'}): ${
            apiMessage || fallbackMessage
          }`
        );
      }
    }
  }
}