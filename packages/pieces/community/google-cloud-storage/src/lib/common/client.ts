import {
  httpClient,
  HttpMethod,
  AuthenticationType,
} from '@activepieces/pieces-common';
import { AppConnectionType, ServerContext } from '@activepieces/pieces-framework';

import type { GoogleCloudStorageAuthValue } from './types';
import { gcsUtils } from './utils';
import { gcsWorkloadIdentity } from './workload-identity';

async function getAccessToken({
  auth,
  server,
}: {
  auth: GoogleCloudStorageAuthValue;
  server: ServerContext;
}): Promise<string> {
  if (auth.type === AppConnectionType.OIDC) {
    return gcsWorkloadIdentity.exchangeAccessToken({ props: auth.props, server });
  }
  return auth.access_token;
}

function describeApiError(error: unknown): string {
  const body = gcsUtils.isRecord(error) ? gcsUtils.recordField(error, 'response')?.['body'] : undefined;
  const apiError = gcsUtils.recordField(body, 'error');
  const apiMessage = gcsUtils.stringField(apiError, 'message');
  if (apiMessage) {
    const permission = gcsUtils
      .arrayField(apiError, 'details')
      .map((detail) => gcsUtils.stringField(gcsUtils.recordField(detail, 'metadata'), 'permission'))
      .find((value) => value !== undefined);
    const message = gcsUtils.trimTrailingPeriod(apiMessage);
    return permission ? `${message} (missing permission: ${permission}).` : `${message}.`;
  }
  if (typeof body === 'string' && body.trim() !== '') {
    return truncate(body.trim());
  }
  if (error instanceof Error && error.message) {
    return truncate(error.message);
  }
  return 'Unknown error.';
}

function truncate(text: string): string {
  return text.length > MAX_ERROR_LENGTH ? `${text.slice(0, MAX_ERROR_LENGTH)}…` : text;
}

export const gcsCommon = {
  gcsBaseUrl: 'https://www.googleapis.com/storage/v1',
  pubsubBaseUrl: 'https://pubsub.googleapis.com/v1',
  getAccessToken,
  describeApiError,

  async makeGCSRequest(
    method: HttpMethod,
    path: string,
    accessToken: string,
    body?: any
  ): Promise<any> {
    const url = path.startsWith('http') ? path : `${this.gcsBaseUrl}${path}`;

    const response = await httpClient.sendRequest({
      method,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      body,
    });

    return response.body;
  },

  async makePubSubRequest(
    method: HttpMethod,
    path: string,
    accessToken: string,
    body?: any
  ): Promise<any> {
    const url = path.startsWith('http') ? path : `${this.pubsubBaseUrl}${path}`;

    const response = await httpClient.sendRequest({
      method,
      url,
      authentication: {
        type: AuthenticationType.BEARER_TOKEN,
        token: accessToken,
      },
      body,
    });

    return response.body;
  },

  // For backward compatibility
  async makeRequest(
    method: HttpMethod,
    path: string,
    accessToken: string,
    body?: any
  ): Promise<any> {
    return this.makeGCSRequest(method, path, accessToken, body);
  },
};

const MAX_ERROR_LENGTH = 300;
