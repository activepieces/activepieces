import {
  httpClient,
  HttpMethod,
  HttpMessageBody,
  HttpResponse,
} from '@activepieces/pieces-common';
import { OutputSchemaField, Property } from '@activepieces/pieces-framework';
import { normalizeBaseUrl, postizAuth, PostizAuth } from './auth';

async function postizApiCall<T extends HttpMessageBody>({
  auth,
  method,
  path,
  body,
  queryParams,
}: {
  auth: PostizAuth;
  method: HttpMethod;
  path: string;
  body?: unknown;
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return await httpClient.sendRequest<T>({
    method,
    url: `${normalizeBaseUrl({ baseUrl: auth.props.base_url })}${path}`,
    headers: {
      Authorization: auth.props.api_key,
      Accept: 'application/json',
    },
    queryParams,
    body,
  });
}

function postizPath({ segments }: { segments: string[] }): string {
  return segments.map((segment) => `/${encodeURIComponent(segment)}`).join('');
}

function requireText({ value, label }: { value: unknown; label: string }): string {
  const text = typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : '';
  if (text.length === 0) {
    throw new Error(`${label} is required.`);
  }
  return text;
}

async function listIntegrations({ auth }: { auth: PostizAuth }): Promise<PostizIntegration[]> {
  const response = await postizApiCall<PostizIntegration[]>({
    auth,
    method: HttpMethod.GET,
    path: '/integrations',
  });
  return Array.isArray(response.body) ? response.body : [];
}

function mapPost({ post }: { post: PostizPost }): MappedPostizPost {
  return {
    id: post.id,
    content: post.content ?? null,
    publish_date: post.publishDate ?? null,
    release_url: post.releaseURL ?? null,
    state: post.state ?? null,
    error: post.error ?? null,
    integration_id: post.integration?.id ?? null,
    integration_provider: post.integration?.providerIdentifier ?? null,
    integration_name: post.integration?.name ?? null,
  };
}

const postOutputFields: OutputSchemaField[] = [
  { key: 'id', label: 'Post ID' },
  { key: 'content', label: 'Content' },
  { key: 'publish_date', label: 'Publish Date', format: 'datetime' },
  { key: 'release_url', label: 'Release URL', format: 'url' },
  { key: 'state', label: 'State' },
  { key: 'error', label: 'Error' },
  { key: 'integration_id', label: 'Channel ID' },
  { key: 'integration_provider', label: 'Channel Provider' },
  { key: 'integration_name', label: 'Channel Name' },
];

function withUtcOffset({ value }: { value: string }): string {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(trimmed)) {
    return `${trimmed}Z`;
  }
  return trimmed;
}

function requirePositiveInteger({ value, label }: { value: unknown; label: string }): number {
  const parsed = typeof value === 'number' ? value : typeof value === 'string' && value.trim() !== '' ? Number(value) : NaN;
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`${label} must be a whole number of 1 or more.`);
  }
  return parsed;
}

const postizCommon = {
  integrationDropdown: Property.Dropdown({
    displayName: 'Channel',
    description: 'Select the connected social media channel',
    refreshers: ['auth'],
    required: true,
    auth: postizAuth,
    options: async ({ auth }) => {
      if (!auth) {
        return {
          disabled: true,
          options: [],
          placeholder: 'Please connect your Postiz account first',
        };
      }
      try {
        const integrations = await listIntegrations({ auth });
        return {
          disabled: false,
          options: integrations.map((integration) => ({
            label: `${integration.name} (${integration.identifier})`,
            value: integration.id,
          })),
        };
      } catch {
        return {
          disabled: true,
          options: [],
          placeholder: 'Could not load channels. Check your connection.',
        };
      }
    },
  }),
};

export { postizApiCall, postizPath, requireText, withUtcOffset, requirePositiveInteger, listIntegrations, mapPost, postOutputFields, postizCommon };

export type PostizIntegration = {
  id: string;
  name: string;
  identifier: string;
  picture?: string | null;
  disabled?: boolean;
  profile?: string | null;
  customer?: { id: string; name: string } | null;
};

export type PostizPost = {
  id: string;
  content?: string | null;
  publishDate?: string | null;
  releaseURL?: string | null;
  state?: string | null;
  error?: string | null;
  integration?: {
    id?: string;
    providerIdentifier?: string;
    name?: string;
    picture?: string;
  } | null;
};

export type MappedPostizPost = {
  id: string;
  content: string | null;
  publish_date: string | null;
  release_url: string | null;
  state: string | null;
  error: string | null;
  integration_id: string | null;
  integration_provider: string | null;
  integration_name: string | null;
};

export type { PostizAuth } from './auth';
