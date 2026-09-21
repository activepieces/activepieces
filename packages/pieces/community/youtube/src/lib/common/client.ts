import {
  httpClient,
  HttpError,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

const YOUTUBE_API_BASE_URL = 'https://www.googleapis.com/youtube/v3';

function describeFailure({
  status,
  operation,
}: {
  status: number;
  operation: string;
}): string {
  switch (status) {
    case 401:
      return `YouTube rejected the connection while running ${operation}. Reconnect the YouTube account and try again.`;
    case 403:
      return `YouTube denied ${operation}. The connected account may not own this resource, the required permission may be missing, or the daily API quota may be exhausted.`;
    case 404:
      return `YouTube could not find the resource for ${operation}. Check the identifier and that the connected account can access it.`;
    case 409:
      return `YouTube reported a conflict for ${operation}. The resource changed since it was read; re-read it and try again.`;
    case 429:
      return `YouTube rate limited ${operation}. Wait before retrying.`;
    default:
      return `YouTube returned HTTP ${status} for ${operation}.`;
  }
}

async function sendRequest<T>({
  accessToken,
  method,
  path,
  operation,
  queryParams,
  body,
}: YoutubeRequestParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${YOUTUBE_API_BASE_URL}${path}`,
      headers: { Authorization: `Bearer ${accessToken}` },
      queryParams,
      body,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      const status = error.response.status;
      throw new YoutubeApiError({
        status,
        message: `${describeFailure({ status, operation })} Details: ${JSON.stringify(
          error.response.body
        )}`,
      });
    }
    throw error;
  }
}

export class YoutubeApiError extends Error {
  public readonly status: number;

  constructor({ status, message }: { status: number; message: string }) {
    super(message);
    this.name = 'YoutubeApiError';
    this.status = status;
  }
}

export const youtubeClient = { sendRequest };

export type YoutubeRequestParams = {
  accessToken: string;
  method: HttpMethod;
  path: string;
  operation: string;
  queryParams?: QueryParams;
  body?: unknown;
};
