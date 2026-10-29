import { createAction, Property } from '@activepieces/pieces-framework';
import { AuthenticationType, httpClient, HttpError, HttpMethod } from '@activepieces/pieces-common';
import { huggingFaceAuth } from '../auth';
import { hfHub } from '../common/hub-client';
import { listInferenceEndpointsOutputSchema } from '../output-schemas';

export const listInferenceEndpoints = createAction({
  auth: huggingFaceAuth,
  name: 'list_inference_endpoints',
  classification: 'SEARCH',
  displayName: 'List Inference Endpoints',
  description: 'List the dedicated Inference Endpoints of a Hugging Face user or organization.',
  audience: 'ai',
  aiMetadata: {
    description:
      "Lists the dedicated Inference Endpoints (paid, billing-enabled deployments) of a namespace, which defaults to the connected user: name, model repository, task, framework, state (for example 'running', 'paused' or 'scaledToZero'), public URL, access type, hardware, cloud vendor and region, and replica bounds. Pass an organization name to list its endpoints. A namespace without a payment method has no endpoints and may answer 401. Environment variables and secrets of the endpoints are never returned. For the serverless Inference Providers, use the inference actions instead. Read-only and safe to retry.",
    idempotent: true,
  },
  outputSchema: listInferenceEndpointsOutputSchema,
  props: {
    namespace: Property.ShortText({
      displayName: 'Namespace',
      description:
        "The user or organization that owns the endpoints, for example 'my-org'. Leave empty for the connected user. Get organization names from Get Current User & Token.",
      required: false,
    }),
  },
  async run(context) {
    const token = context.auth.secret_text;
    const namespace = context.propsValue.namespace?.trim() || (await currentUsername(token));
    const path = `/endpoint/${encodeURIComponent(namespace)}`;
    let body: unknown;
    try {
      const response = await httpClient.sendRequest<unknown>({
        method: HttpMethod.GET,
        url: `${INFERENCE_ENDPOINTS_BASE_URL}${path}`,
        authentication: { type: AuthenticationType.BEARER_TOKEN, token },
      });
      body = response.body;
    } catch (error) {
      if (error instanceof HttpError && (error.response.status === 401 || error.response.status === 403)) {
        throw new Error(
          `Inference Endpoints refused the request for namespace '${namespace}' (${error.response.status}). Either the namespace has no payment method (Inference Endpoints are a paid product), this account is not a member of it, or the token lacks the Inference Endpoints read permission.`
        );
      }
      throw hfHub.toError({ error, resource: `Inference Endpoints ${path}` });
    }
    const items = hfHub.isRecord(body) && Array.isArray(body['items']) ? body['items'].filter(hfHub.isRecord) : [];
    const endpoints = items.map(toEndpoint);
    return { namespace, endpoints, count: endpoints.length };
  },
});

async function currentUsername(token: string): Promise<string> {
  const response = await hfHub.request<unknown>({
    token,
    method: HttpMethod.GET,
    path: '/api/whoami-v2',
  });
  const name = hfHub.isRecord(response.body) ? response.body['name'] : undefined;
  if (typeof name !== 'string' || name.length === 0) {
    throw new Error('Could not determine the connected username. Provide Namespace explicitly.');
  }
  return name;
}

function toEndpoint(raw: Record<string, unknown>): EndpointRow {
  const model = pickRecord({ source: raw, key: 'model' });
  const status = pickRecord({ source: raw, key: 'status' });
  const compute = pickRecord({ source: raw, key: 'compute' });
  const scaling = pickRecord({ source: compute, key: 'scaling' });
  const provider = pickRecord({ source: raw, key: 'provider' });
  return {
    name: pickString({ source: raw, key: 'name' }),
    type: pickString({ source: raw, key: 'type' }),
    state: pickString({ source: status, key: 'state' }),
    url: pickString({ source: status, key: 'url' }),
    status_message: pickString({ source: status, key: 'message' }),
    created_at: pickString({ source: status, key: 'createdAt' }),
    updated_at: pickString({ source: status, key: 'updatedAt' }),
    repository: pickString({ source: model, key: 'repository' }),
    revision: pickString({ source: model, key: 'revision' }),
    task: pickString({ source: model, key: 'task' }),
    framework: pickString({ source: model, key: 'framework' }),
    accelerator: pickString({ source: compute, key: 'accelerator' }),
    instance_type: pickString({ source: compute, key: 'instanceType' }),
    instance_size: pickString({ source: compute, key: 'instanceSize' }),
    min_replica: pickNumber({ source: scaling, key: 'minReplica' }),
    max_replica: pickNumber({ source: scaling, key: 'maxReplica' }),
    vendor: pickString({ source: provider, key: 'vendor' }),
    region: pickString({ source: provider, key: 'region' }),
  };
}

function pickRecord({ source, key }: PickParams): Record<string, unknown> | null {
  const value = source?.[key];
  return hfHub.isRecord(value) ? value : null;
}

function pickString({ source, key }: PickParams): string | null {
  const value = source?.[key];
  return typeof value === 'string' ? value : null;
}

function pickNumber({ source, key }: PickParams): number | null {
  const value = source?.[key];
  return typeof value === 'number' ? value : null;
}

const INFERENCE_ENDPOINTS_BASE_URL = 'https://api.endpoints.huggingface.cloud/v2';

type PickParams = {
  source: Record<string, unknown> | null;
  key: string;
};

type EndpointRow = {
  name: string | null;
  type: string | null;
  state: string | null;
  url: string | null;
  status_message: string | null;
  created_at: string | null;
  updated_at: string | null;
  repository: string | null;
  revision: string | null;
  task: string | null;
  framework: string | null;
  accelerator: string | null;
  instance_type: string | null;
  instance_size: string | null;
  min_replica: number | null;
  max_replica: number | null;
  vendor: string | null;
  region: string | null;
};
