import { Property } from '@activepieces/pieces-framework';
import {
  AuthenticationType,
  httpClient,
  HttpError,
  HttpMethod,
  HttpResponse,
} from '@activepieces/pieces-common';
import { hfHub } from './hub-client';

async function settingsRequest<T>({ token, method, path, body }: SettingsRequestParams): Promise<HttpResponse<T>> {
  try {
    return await httpClient.sendRequest<T>({
      method,
      url: `${hfHub.baseUrl}${path}`,
      body,
      authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    });
  } catch (error) {
    if (error instanceof HttpError && (error.response.status === 401 || error.response.status === 403)) {
      throw new Error(
        `Hugging Face refused ${method} ${path} (${error.response.status}). This action needs a 'write' role token, or a fine-grained token with the matching user-settings permission (webhooks, notifications or watch settings). Call Get Current User & Token to check the token role.`
      );
    }
    throw hfHub.toError({ error, resource: path });
  }
}

function assertObjectId({ value, label }: AssertObjectIdParams): string {
  const trimmed = value.trim();
  if (!OBJECT_ID_PATTERN.test(trimmed)) {
    throw new Error(
      `${label} '${value}' is not a valid Hugging Face ID. It must be a 24-character hexadecimal ObjectId, for example '6390e855e30d9209411de93b'.`
    );
  }
  return trimmed;
}

function webhookPath(webhookId: string): string {
  return `/api/settings/webhooks/${encodeURIComponent(assertObjectId({ value: webhookId, label: 'Webhook ID' }))}`;
}

function assertHttpsUrl(value: string): string {
  const trimmed = value.trim();
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    throw new Error(`Target URL '${value}' is not a valid URL. Use a full https:// address.`);
  }
  if (parsed.protocol !== 'https:') {
    throw new Error(`Target URL must use https://, got '${parsed.protocol}//'.`);
  }
  return parsed.toString();
}

function assertSecret(value: string): string {
  if (value.length === 0 || !SECRET_PATTERN.test(value)) {
    throw new Error('Secret must be a non-empty string of printable ASCII characters.');
  }
  return value;
}

function parseWatched(value: unknown): WatchedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const items: WatchedItem[] = [];
  for (const entry of value) {
    if (!hfHub.isRecord(entry)) {
      continue;
    }
    const type = typeof entry['type'] === 'string' ? entry['type'].trim() : '';
    const name = typeof entry['name'] === 'string' ? entry['name'].trim() : '';
    if (type.length === 0 && name.length === 0) {
      continue;
    }
    if (!isWatchedType(type)) {
      throw new Error(
        `Watched item type '${type}' is not supported. Use one of: ${WATCHED_TYPES.join(', ')}.`
      );
    }
    if (name.length === 0) {
      throw new Error(`Every watched item needs a name (a username, organization name or 'namespace/name' repository ID).`);
    }
    items.push({ type, name });
  }
  return items;
}

function existingWatched(value: unknown): ExistingWatchedItem[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .filter(hfHub.isRecord)
    .filter((item) => typeof item['type'] === 'string' && typeof item['name'] === 'string')
    .map((item) => ({ type: String(item['type']), name: String(item['name']) }));
}

function parseDomains(value: unknown): WebhookDomain[] {
  if (!Array.isArray(value)) {
    return [];
  }
  const domains: WebhookDomain[] = [];
  for (const entry of value) {
    if (entry === 'repo' || entry === 'discussion') {
      if (!domains.includes(entry)) {
        domains.push(entry);
      }
      continue;
    }
    throw new Error(`Domain '${String(entry)}' is not supported. Use 'repo', 'discussion' or both.`);
  }
  return domains;
}

function toWebhookOutput(raw: unknown): WebhookOutput {
  const source = hfHub.isRecord(raw) ? raw : {};
  const disabledRaw = source['disabled'];
  const watchedRaw = Array.isArray(source['watched']) ? source['watched'].filter(hfHub.isRecord) : [];
  const domainsRaw = Array.isArray(source['domains']) ? source['domains'] : [];
  return {
    id: typeof source['id'] === 'string' ? source['id'] : null,
    url: typeof source['url'] === 'string' ? source['url'] : null,
    enabled: disabledRaw === false,
    disabled_reason: typeof disabledRaw === 'string' ? disabledRaw : disabledRaw === true ? 'disabled' : null,
    watched: watchedRaw.map((item) => ({
      type: typeof item['type'] === 'string' ? item['type'] : null,
      name: typeof item['name'] === 'string' ? item['name'] : null,
    })),
    domains: domainsRaw.filter((item): item is string => typeof item === 'string'),
    has_secret: source['hasSecret'] === true,
    runs_job: hfHub.isRecord(source['job']),
    last_trigger_at: typeof source['lastTriggerAt'] === 'string' ? source['lastTriggerAt'] : null,
  };
}

function unwrapWebhook(body: unknown): unknown {
  if (hfHub.isRecord(body) && hfHub.isRecord(body['webhook'])) {
    return body['webhook'];
  }
  return body;
}

async function fetchWebhook({ token, webhookId }: FetchWebhookParams): Promise<Record<string, unknown>> {
  const response = await settingsRequest<unknown>({
    token,
    method: HttpMethod.GET,
    path: webhookPath(webhookId),
  });
  const webhook = unwrapWebhook(response.body);
  if (!hfHub.isRecord(webhook)) {
    throw new Error(`Hugging Face returned no webhook for ID '${webhookId}'.`);
  }
  return webhook;
}

function isWatchedType(value: string): value is WatchedType {
  return WATCHED_TYPES.some((type) => type === value);
}

function watchedItemsProp({ required, description }: WatchedItemsPropParams) {
  return Property.Array({
    displayName: 'Watched Items',
    description,
    required,
    properties: {
      type: Property.StaticDropdown({
        displayName: 'Type',
        description: "What to watch: a user, an organization, or one model, dataset or Space repository.",
        required: true,
        options: {
          disabled: false,
          options: [
            { label: 'User', value: 'user' },
            { label: 'Organization', value: 'org' },
            { label: 'Model', value: 'model' },
            { label: 'Dataset', value: 'dataset' },
            { label: 'Space', value: 'space' },
          ],
        },
      }),
      name: Property.ShortText({
        displayName: 'Name',
        description: "A username ('julien-c'), organization name ('huggingface') or repository ID ('openai-community/gpt2').",
        required: true,
      }),
    },
  });
}

function domainsProp({ required, description }: DomainsPropParams) {
  return Property.StaticMultiSelectDropdown({
    displayName: 'Domains',
    description,
    required,
    options: {
      disabled: false,
      options: [
        { label: 'Repository changes (commits, tags, settings)', value: 'repo' },
        { label: 'Discussions and pull requests', value: 'discussion' },
      ],
    },
  });
}

function webhookIdProp() {
  return Property.ShortText({
    displayName: 'Webhook ID',
    description: "The webhook's 24-character hexadecimal ID. Find it with List Webhooks.",
    required: true,
  });
}

const OBJECT_ID_PATTERN = /^[0-9a-fA-F]{24}$/;
const SECRET_PATTERN = /^[\x20-\x7F]*$/;
const WATCHED_TYPES: WatchedType[] = ['user', 'org', 'model', 'dataset', 'space'];

export const hfSettingsApi = {
  request: settingsRequest,
  assertObjectId,
};

export const hfWebhooks = {
  path: webhookPath,
  assertHttpsUrl,
  assertSecret,
  parseWatched,
  existingWatched,
  parseDomains,
  toOutput: toWebhookOutput,
  unwrap: unwrapWebhook,
  fetch: fetchWebhook,
  watchedItemsProp,
  domainsProp,
  webhookIdProp,
};

export type WatchedType = 'user' | 'org' | 'model' | 'dataset' | 'space';

export type WatchedItem = {
  type: WatchedType;
  name: string;
};

export type ExistingWatchedItem = {
  type: string;
  name: string;
};

export type WebhookDomain = 'repo' | 'discussion';

export type WebhookOutput = {
  id: string | null;
  url: string | null;
  enabled: boolean;
  disabled_reason: string | null;
  watched: { type: string | null; name: string | null }[];
  domains: string[];
  has_secret: boolean;
  runs_job: boolean;
  last_trigger_at: string | null;
};

type SettingsRequestParams = {
  token: string;
  method: HttpMethod;
  path: string;
  body?: unknown;
};

type AssertObjectIdParams = {
  value: string;
  label: string;
};

type FetchWebhookParams = {
  token: string;
  webhookId: string;
};

type WatchedItemsPropParams = {
  required: boolean;
  description: string;
};

type DomainsPropParams = {
  required: boolean;
  description: string;
};
