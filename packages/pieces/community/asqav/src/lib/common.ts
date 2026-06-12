import {
  httpClient,
  HttpError,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

export const ASQAV_BASE_URL = 'https://api.asqav.com/api/v1';

interface AsqavApiCallParams {
  apiKey: string;
  method: HttpMethod;
  resourceUri: string;
  queryParams?: QueryParams;
  body?: unknown;
}

export async function asqavApiCall<T>({
  apiKey,
  method,
  resourceUri,
  queryParams,
  body,
}: AsqavApiCallParams): Promise<T> {
  try {
    const response = await httpClient.sendRequest<T>({
      method,
      url: `${ASQAV_BASE_URL}${resourceUri}`,
      headers: {
        'X-API-Key': apiKey,
      },
      queryParams,
      body,
    });
    return response.body;
  } catch (error) {
    throw mapAsqavError(error);
  }
}

function extractDetail(body: unknown): { reason?: string; text: string } {
  if (typeof body === 'object' && body !== null && 'detail' in body) {
    const detail = (body as { detail: unknown }).detail;
    if (typeof detail === 'string') {
      return { text: detail };
    }
    if (Array.isArray(detail)) {
      // FastAPI validation errors: [{ loc, msg, type, input }, ...]
      const text = detail
        .map((item: { loc?: unknown[]; msg?: string }) => {
          const field = Array.isArray(item.loc) ? item.loc.join('.') : '';
          return field ? `${field}: ${item.msg ?? ''}` : item.msg ?? JSON.stringify(item);
        })
        .join('; ');
      return { text };
    }
    if (typeof detail === 'object' && detail !== null) {
      const obj = detail as { reason?: string; error?: string; detail?: string; message?: string };
      return {
        reason: obj.reason ?? obj.error,
        text: obj.detail ?? obj.message ?? JSON.stringify(detail),
      };
    }
    return { text: JSON.stringify(detail) };
  }
  return { text: typeof body === 'string' ? body : JSON.stringify(body) };
}

function mapAsqavError(error: unknown): Error {
  if (!(error instanceof HttpError)) {
    return error instanceof Error ? error : new Error(String(error));
  }
  const status = error.response.status;
  const { reason, text } = extractDetail(error.response.body);

  switch (status) {
    case 401:
      return new Error(
        'Asqav rejected the API key (401). Reconnect with a valid key from your Asqav dashboard at https://asqav.com.'
      );
    case 403:
      if (reason === 'content_scan_blocked') {
        return new Error(
          `Asqav's content scanner blocked signing (403): ${text} Remove sensitive data such as PII from the Context and retry.`
        );
      }
      return new Error(
        `Asqav refused the request (403): ${text} The key may lack the required scope, or the agent may be suspended or owned by another organization.`
      );
    case 412:
      if (reason === 'no_policy_evaluated_for_action_type') {
        return new Error(
          `Asqav precondition failed (412): ${text} Compliance mode needs an active policy matching this action type. Create one in your Asqav dashboard, or turn off Compliance Mode on this step.`
        );
      }
      if (reason === 'compliance_mode_strict_unsigned_action') {
        return new Error(
          `Asqav precondition failed (412): ${text} Your organization requires compliance mode, so enable Compliance Mode on this step.`
        );
      }
      return new Error(`Asqav precondition failed (412): ${text}`);
    case 422:
      return new Error(
        `Asqav rejected the request payload (422): ${text}. Check the step inputs, for example Context must be a JSON object.`
      );
    case 429:
      return new Error(
        `Asqav rate limit reached (429): ${text} Wait and retry, or raise the plan limit in your Asqav dashboard.`
      );
    default:
      return new Error(`Asqav API error (${status}): ${text}`);
  }
}

interface AsqavAgent {
  agent_id: string;
  name: string;
  algorithm: string;
}

export async function getOrCreateAgent(
  apiKey: string,
  name: string
): Promise<AsqavAgent> {
  const existing = await asqavApiCall<AsqavAgent[]>({
    apiKey,
    method: HttpMethod.GET,
    resourceUri: '/agents',
    queryParams: { name, revoked: 'false', limit: '50' },
  });
  const match = existing.find((agent) => agent.name === name);
  if (match) {
    return match;
  }
  return asqavApiCall<AsqavAgent>({
    apiKey,
    method: HttpMethod.POST,
    resourceUri: '/agents/create',
    body: {
      name,
      algorithm: 'ml-dsa-65',
      capabilities: [],
    },
  });
}