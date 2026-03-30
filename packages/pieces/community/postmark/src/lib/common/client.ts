import {
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

const POSTMARK_API_BASE_URL = 'https://api.postmarkapp.com';

type PostmarkApiOptions = {
  method: HttpMethod;
  path: string;
  apiToken: string;
  body?: unknown;
  queryParams?: QueryParams;
};

type PostmarkErrorBody = {
  ErrorCode?: number;
  Message?: string;
};

async function postmarkRequest<TResponse>({
  method,
  path,
  apiToken,
  body,
  queryParams,
}: PostmarkApiOptions): Promise<TResponse> {
  try {
    const response = await httpClient.sendRequest<TResponse>({
      method,
      url: `${POSTMARK_API_BASE_URL}${path}`,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': apiToken,
      },
      body,
      queryParams,
    });

    return response.body;
  } catch (error) {
    const postmarkError = error as {
      response?: { body?: PostmarkErrorBody; status?: number };
    };
    const message =
      postmarkError.response?.body?.Message ??
      `Postmark API request failed${
        postmarkError.response?.status
          ? ` (${postmarkError.response.status})`
          : ''
      }`;
    throw new Error(message);
  }
}

export const postmarkClient = {
  get: <TResponse>(apiToken: string, path: string, queryParams?: QueryParams) =>
    postmarkRequest<TResponse>({
      method: HttpMethod.GET,
      path,
      apiToken,
      queryParams,
    }),
  post: <TResponse>(apiToken: string, path: string, body?: unknown) =>
    postmarkRequest<TResponse>({
      method: HttpMethod.POST,
      path,
      apiToken,
      body,
    }),
};

export type MessageStream = {
  ID: string;
  ServerID?: number;
  Name: string;
  MessageStreamType?: string;
  Description?: string;
  ArchivedAt?: string | null;
};

export type MessageStreamListResponse = {
  MessageStreams: MessageStream[];
  TotalCount: number;
};

export type SendEmailResponse = {
  To: string;
  SubmittedAt: string;
  MessageID: string;
  ErrorCode: number;
  Message: string;
};

export type Bounce = {
  ID: number;
  Type: string;
  TypeCode: number;
  Name?: string;
  Tag?: string;
  MessageID: string;
  Description: string;
  Details?: string;
  Email: string;
  BouncedAt: string;
  DumpAvailable?: boolean;
  Inactive?: boolean;
  CanActivate?: boolean;
  Content?: string;
  Subject?: string;
};

export type BounceListResponse = {
  TotalCount: number;
  Bounces: Bounce[];
};

export type DeliveryStatsResponse = {
  InactiveMails?: number;
  Bounces?: Array<{ Type: string; Name: string; Count: number }>;
};
