import {
  AuthenticationType,
  httpClient,
  HttpMessageBody,
  HttpMethod,
  HttpResponse,
} from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { feedhiveAuth } from './auth';

const BASE_URL = 'https://api.feedhive.com';

const socialsMultiDropdown = Property.MultiSelectDropdown({
  displayName: 'Social Accounts',
  description: 'Select the social media accounts to publish this post to.',
  refreshers: [],
  required: false,
  auth: feedhiveAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    }
    try {
      const response = await apiCall<{
        data: { id: string; platform: string; display_name: string; handle: string; status: string }[];
      }>({ token: auth as unknown as string, method: HttpMethod.GET, path: '/socials' });
      return {
        disabled: false,
        options: (response.body.data ?? [])
          .filter((a) => a.status === 'active')
          .map((a) => ({
            label: `${a.display_name} (@${a.handle}) — ${a.platform}`,
            value: a.id,
          })),
      };
    } catch {
      return {
        disabled: true,
        options: [],
        placeholder: 'Failed to load social accounts. Check your connection.',
      };
    }
  },
});

const labelsMultiDropdown = Property.MultiSelectDropdown({
  displayName: 'Labels',
  description: 'Optionally assign labels to organise this post in FeedHive.',
  refreshers: [],
  required: false,
  auth: feedhiveAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    }
    try {
      const response = await apiCall<{
        data: { items: { id: string; title: string }[] };
      }>({ token: auth as unknown as string, method: HttpMethod.GET, path: '/labels' });
      return {
        disabled: false,
        options: (response.body.data?.items ?? []).map((l) => ({
          label: l.title,
          value: l.id,
        })),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load labels. Check your connection.' };
    }
  },
});

const postDropdown = Property.Dropdown({
  displayName: 'Post',
  description: 'Select the post you want to act on.',
  refreshers: [],
  required: true,
  auth: feedhiveAuth,
  options: async ({ auth }) => {
    if (!auth) {
      return { disabled: true, options: [], placeholder: 'Please connect your account first' };
    }
    try {
      const response = await apiCall<{
        data: { items: { id: string; text: string; status: string }[] };
      }>({
        token: auth as unknown as string,
        method: HttpMethod.GET,
        path: '/posts',
        queryParams: { limit: '100' },
      });
      return {
        disabled: false,
        options: (response.body.data?.items ?? []).map((p) => {
          const preview = p.text ? p.text.slice(0, 60) + (p.text.length > 60 ? '…' : '') : '(no text)';
          return { label: `${preview} [${p.status}]`, value: p.id };
        }),
      };
    } catch {
      return { disabled: true, options: [], placeholder: 'Failed to load posts. Check your connection.' };
    }
  },
});

export const feedhiveCommon = {
  socialsMultiDropdown,
  labelsMultiDropdown,
  postDropdown,
  apiCall,
  flattenPost,
};

async function apiCall<T extends HttpMessageBody>({
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
  queryParams?: Record<string, string>;
}): Promise<HttpResponse<T>> {
  return httpClient.sendRequest<T>({
    method,
    url: `${BASE_URL}${path}`,
    authentication: { type: AuthenticationType.BEARER_TOKEN, token },
    queryParams,
    body,
  });
}

function flattenPost(post: Record<string, unknown>): Record<string, unknown> {
  const approval = post['approval'] as
    | { status?: string; is_approved?: boolean; approved_at?: string }
    | undefined;
  return {
    id: post['id'] ?? null,
    status: post['status'] ?? null,
    text: post['text'] ?? null,
    accounts: Array.isArray(post['accounts']) && (post['accounts'] as string[]).length > 0
      ? (post['accounts'] as string[]).join(', ')
      : null,
    labels: Array.isArray(post['labels']) && (post['labels'] as string[]).length > 0
      ? (post['labels'] as string[]).join(', ')
      : null,
    media: Array.isArray(post['media']) && (post['media'] as string[]).length > 0
      ? (post['media'] as string[]).join(', ')
      : null,
    notes: post['notes'] ?? null,
    short_link_enabled: post['short_link_enabled'] ?? null,
    scheduled_at: post['scheduled_at'] ?? null,
    published_at: post['published_at'] ?? null,
    slot_id: post['slot_id'] ?? null,
    approval_status: approval?.status ?? null,
    approval_is_approved: approval?.is_approved ?? null,
    approval_approved_at: approval?.approved_at ?? null,
    created_at: post['created_at'] ?? null,
    updated_at: post['updated_at'] ?? null,
  };
}
