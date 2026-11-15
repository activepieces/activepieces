import {
  AuthenticationType,
  HttpError,
  HttpMethod,
  HttpRequest,
  QueryParams,
  httpClient,
} from '@activepieces/pieces-common';
import { OAuth2PropertyValue } from '@activepieces/pieces-framework';

export const ringcentralCommon = {
  getServerUrl,
  sendRequest,
  createSubscription,
  deleteSubscription,
};

/**
 * RingCentral 4xx bodies name the real cause (`{ errorCode, message, errors: [...] }`), so surface
 * that instead of a stringified axios failure. The bearer token travels in a header, never in the
 * URL or body, so echoing the response body is safe here.
 */
export function describeRingCentralError(
  err: unknown,
  method: HttpMethod,
  resourcePath: string,
): string {
  const call = `${method} ${resourcePath}`;
  if (!(err instanceof HttpError)) {
    const detail = err instanceof Error && err.message ? ` (${err.message})` : '';
    return `RingCentral request ${call} failed before a response arrived${detail}.`;
  }

  const { status, body } = err.errorMessage().response as {
    status: number;
    body?: RingCentralErrorBody;
  };
  const detail = ringcentralErrorDetail(body);

  switch (status) {
    case 401:
      return `RingCentral rejected the connection's token (401 on ${call}). Reconnect the RingCentral connection.${detail}`;
    case 403:
      return `RingCentral refused ${call} (403). Usually the app in the RingCentral Developer Console is missing the permission this needs (for example SMS, RingOut or TeamMessaging).${detail}`;
    case 429:
      return `RingCentral rate-limited ${call} (429). Wait for the window to reset or slow the flow down.${detail}`;
    default:
      return `RingCentral answered ${status} for ${call}.${detail}`;
  }
}

const PRODUCTION_SERVER = 'platform.ringcentral.com';

// The documented maximum lifetime of a WebHook subscription (20 years). RingCentral still kills a
// subscription on its own when the endpoint keeps failing deliveries (blacklisting), which is why
// unsubscribe tolerates an already-dead id rather than assuming this expiry is ever reached.
const SUBSCRIPTION_EXPIRES_IN_SECONDS = 630720000;

// RingCentral answers interactive calls well under a second; a step that sits longer than this is
// stuck, and a stuck step stalls the whole flow run.
const REQUEST_TIMEOUT_MS = 30_000;

// 5xx-only, with backoff, per pieces-common. Reads are safe to repeat; writes are not retried at
// all because a replayed RingOut dials someone twice and a replayed SMS sends twice.
const READ_RETRIES = 3;

// Declarations rather than arrow consts on purpose: they are hoisted, which is what lets
// `ringcentralCommon` above collect them before they appear in source order.
function getServerUrl(auth: OAuth2PropertyValue): string {
  const server = auth.props?.['environment'] ?? PRODUCTION_SERVER;
  return `https://${server}`;
}

async function sendRequest<T = unknown>({
  auth,
  method,
  resourcePath,
  body,
  queryParams,
  responseType,
}: {
  auth: OAuth2PropertyValue;
  method: HttpMethod;
  resourcePath: string;
  body?: unknown;
  queryParams?: QueryParams;
  /** `arraybuffer` for the binary endpoints, e.g. message attachment content. Defaults to JSON. */
  responseType?: HttpRequest['responseType'];
}): Promise<T> {
  const request: HttpRequest = {
    method,
    url: `${getServerUrl(auth)}${resourcePath}`,
    authentication: {
      type: AuthenticationType.BEARER_TOKEN,
      token: auth.access_token,
    },
    body,
    queryParams,
    responseType,
    timeout: REQUEST_TIMEOUT_MS,
    retries: method === HttpMethod.GET ? READ_RETRIES : 0,
  };

  try {
    const response = await httpClient.sendRequest<T>(request);
    return response.body;
  } catch (err) {
    throw new Error(describeRingCentralError(err, method, resourcePath));
  }
}

async function createSubscription({
  auth,
  webhookUrl,
  eventFilters,
}: {
  auth: OAuth2PropertyValue;
  webhookUrl: string;
  eventFilters: string[];
}): Promise<string> {
  const subscription = await sendRequest<{ id: string }>({
    auth,
    method: HttpMethod.POST,
    resourcePath: '/restapi/v1.0/subscription',
    body: {
      eventFilters,
      deliveryMode: {
        transportType: 'WebHook',
        address: webhookUrl,
      },
      expiresIn: SUBSCRIPTION_EXPIRES_IN_SECONDS,
    },
  });

  return subscription.id;
}

async function deleteSubscription({
  auth,
  subscriptionId,
}: {
  auth: OAuth2PropertyValue;
  subscriptionId: string;
}): Promise<void> {
  await sendRequest({
    auth,
    method: HttpMethod.DELETE,
    resourcePath: `/restapi/v1.0/subscription/${encodeURIComponent(subscriptionId)}`,
  });
}

function ringcentralErrorDetail(body: RingCentralErrorBody | undefined): string {
  if (!body) return '';
  const messages = (body.errors ?? [])
    .filter((e): e is { errorCode?: string; message?: string } => e !== null)
    .map((e) => [e.errorCode, e.message].filter(Boolean).join(' '));
  if (messages.length === 0 && body.message) {
    messages.push([body.errorCode, body.message].filter(Boolean).join(' '));
  }
  return messages.length > 0 ? ` RingCentral says: ${messages.join('; ')}` : '';
}

type RingCentralErrorBody = {
  errorCode?: string;
  message?: string;
  errors?: Array<{ errorCode?: string; message?: string } | null>;
};

export type RingCentralWebhookEvent<T = Record<string, unknown>> = {
  uuid?: string;
  event?: string;
  timestamp?: string;
  subscriptionId?: string;
  ownerId?: string;
  body?: T;
};
