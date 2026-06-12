import {
  httpClient,
  HttpError,
  HttpMethod,
  QueryParams,
} from '@activepieces/pieces-common';

export const ASQAV_BASE_URL = 'https://api.asqav.com/api/v1';

export class AsqavApiError extends Error {
  constructor(message: string, public readonly status?: number) {
    super(message);
    this.name = 'AsqavApiError';
  }
}

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
      return new AsqavApiError(
        'Asqav rejected the API key (401). Reconnect with a valid key from your Asqav dashboard at https://asqav.com.',
        status
      );
    case 403:
      if (reason === 'content_scan_blocked') {
        return new AsqavApiError(
          `Asqav's content scanner blocked signing (403): ${text} Remove sensitive data such as PII from the Context and retry.`,
          status
        );
      }
      return new AsqavApiError(
        `Asqav refused the request (403): ${text} The key may lack the required scope, or the agent may be suspended or owned by another organization.`,
        status
      );
    case 412:
      if (reason === 'no_policy_evaluated_for_action_type') {
        return new AsqavApiError(
          `Asqav precondition failed (412): ${text} Compliance mode needs an active policy matching this action type. Create one in your Asqav dashboard, or turn off Compliance Mode on this step.`,
          status
        );
      }
      if (reason === 'compliance_mode_strict_unsigned_action') {
        return new AsqavApiError(
          `Asqav precondition failed (412): ${text} Your organization requires compliance mode, so enable Compliance Mode on this step.`,
          status
        );
      }
      return new AsqavApiError(`Asqav precondition failed (412): ${text}`, status);
    case 422:
      return new AsqavApiError(
        `Asqav rejected the request payload (422): ${text}. Check the step inputs, for example Context must be a JSON object.`,
        status
      );
    case 429:
      return new AsqavApiError(
        `Asqav rate limit reached (429): ${text} Wait and retry, or raise the plan limit in your Asqav dashboard.`,
        status
      );
    default:
      return new AsqavApiError(`Asqav API error (${status}): ${text}`, status);
  }
}

interface AsqavAgent {
  agent_id: string;
  name: string;
  algorithm: string;
  created_at: string;
}

// The Asqav API does not enforce unique agent names, so two concurrent
// first runs can each create an agent with the same name. To keep every
// run converging on one canonical agent, always pick the oldest exact
// match (created_at ascending, agent_id as tiebreaker) instead of relying
// on API listing order.
function pickCanonicalAgent(
  agents: AsqavAgent[],
  name: string
): AsqavAgent | undefined {
  return agents
    .filter((agent) => agent.name === name)
    .sort(
      (a, b) =>
        a.created_at.localeCompare(b.created_at) ||
        a.agent_id.localeCompare(b.agent_id)
    )[0];
}

async function listAgentsByName(
  apiKey: string,
  name: string
): Promise<AsqavAgent[]> {
  return asqavApiCall<AsqavAgent[]>({
    apiKey,
    method: HttpMethod.GET,
    resourceUri: '/agents',
    queryParams: { name, revoked: 'false', limit: '50' },
  });
}

export async function getOrCreateAgent(
  apiKey: string,
  name: string
): Promise<AsqavAgent> {
  const existing = pickCanonicalAgent(
    await listAgentsByName(apiKey, name),
    name
  );
  if (existing) {
    return existing;
  }
  const created = await asqavApiCall<AsqavAgent>({
    apiKey,
    method: HttpMethod.POST,
    resourceUri: '/agents/create',
    body: {
      name,
      algorithm: 'ml-dsa-65',
      capabilities: [],
    },
  });
  // Re-list after creating: if a concurrent run created the same name in
  // the GET-to-POST window, both runs settle on the same canonical agent.
  const canonical = pickCanonicalAgent(
    await listAgentsByName(apiKey, name),
    name
  );
  return canonical ?? created;
}