import {
  HttpError,
  HttpMethod,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';

const BASE_URL = 'https://api.pushbullet.com/v2';

function vendorMessage(body: unknown): string | undefined {
  if (typeof body === 'string') {
    try {
      return vendorMessage(JSON.parse(body));
    } catch {
      return body.length > 0 ? body : undefined;
    }
  }
  if (typeof body !== 'object' || body === null || !('error' in body)) {
    return undefined;
  }
  const error = body.error;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    return error.message;
  }
  return undefined;
}

async function request<T>({
  token,
  method,
  path,
  body,
  queryParams,
}: {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: QueryParams;
}): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${BASE_URL}${path}`,
      headers: {
        Authorization: `Bearer ${token.trim()}`,
        Accept: 'application/json',
      },
      body,
      queryParams,
    });
    return response.body;
  } catch (error) {
    if (error instanceof HttpError) {
      const status = error.response.status;
      const message = vendorMessage(error.response.body) ?? 'no error message returned';
      throw new PushbulletApiError({
        message: `Pushbullet API request failed (${status}): ${message}`,
        status,
        responseBody: error.response.body,
      });
    }
    throw error;
  }
}

function buildTarget({
  deviceIden,
  email,
  channelTag,
}: {
  deviceIden?: string;
  email?: string;
  channelTag?: string;
}): PushTarget {
  const provided = [deviceIden, email, channelTag].filter(
    (value) => typeof value === 'string' && value.trim().length > 0
  );
  if (provided.length > 1) {
    throw new Error('Choose only one target: a device, an email address or a channel tag.');
  }
  if (deviceIden && deviceIden.trim()) {
    return { device_iden: deviceIden.trim() };
  }
  if (email && email.trim()) {
    return { email: email.trim() };
  }
  if (channelTag && channelTag.trim()) {
    return { channel_tag: channelTag.trim() };
  }
  return {};
}

class PushbulletApiError extends Error {
  readonly status: number;
  readonly responseBody: unknown;
  constructor({
    message,
    status,
    responseBody,
  }: {
    message: string;
    status: number;
    responseBody: unknown;
  }) {
    super(message);
    this.name = 'PushbulletApiError';
    this.status = status;
    this.responseBody = responseBody;
  }
}

export const pushbulletApi = {
  baseUrl: BASE_URL,
  request,
  buildTarget,
};

export { PushbulletApiError };

export type PushTarget = {
  device_iden?: string;
  email?: string;
  channel_tag?: string;
};

export type PushbulletPush = {
  iden: string;
  type: string;
  active: boolean;
  dismissed: boolean;
  created: number;
  modified: number;
  title?: string;
  body?: string;
  url?: string;
};
