const markyClient = {
  listBusinesses({ apiKey }: { apiKey: string }) {
    return request<BusinessResponse[]>({ apiKey, method: 'GET', path: '/businesses' });
  },

  createPost({ apiKey, body }: { apiKey: string; body: PostCreateRequest }) {
    return request<PostResponse>({ apiKey, method: 'POST', path: '/posts', body });
  },

  updatePost({
    apiKey,
    postId,
    body,
  }: {
    apiKey: string;
    postId: string;
    body: PostUpdateRequest;
  }) {
    return request<PostResponse>({
      apiKey,
      method: 'PATCH',
      path: `/posts/${postId}`,
      body,
    });
  },

  schedulePost({
    apiKey,
    postId,
    body,
  }: {
    apiKey: string;
    postId: string;
    body: PostScheduleRequest;
  }) {
    return request<PostResponse>({
      apiKey,
      method: 'POST',
      path: `/posts/${postId}/schedule`,
      body,
    });
  },

  listPosts({
    apiKey,
    businessId,
    status,
    limit,
    cursor,
  }: {
    apiKey: string;
    businessId: string;
    status?: string;
    limit?: number;
    cursor?: string;
  }) {
    const query = buildQuery({
      business_id: businessId,
      status,
      limit,
      cursor,
    });
    return request<CursorPage<PostResponse>>({
      apiKey,
      method: 'GET',
      path: `/posts${query}`,
    });
  },

  getPost({ apiKey, postId }: { apiKey: string; postId: string }) {
    return request<PostResponse>({ apiKey, method: 'GET', path: `/posts/${postId}` });
  },

  listTopics({ apiKey, businessId }: { apiKey: string; businessId: string }) {
    return request<TopicResponse[]>({
      apiKey,
      method: 'GET',
      path: `/topics${buildQuery({ business_id: businessId })}`,
    });
  },

  createTopic({ apiKey, body }: { apiKey: string; body: TopicCreateRequest }) {
    return request<TopicResponse>({ apiKey, method: 'POST', path: '/topics', body });
  },

  updateTopic({
    apiKey,
    topicId,
    body,
  }: {
    apiKey: string;
    topicId: string;
    body: TopicUpdateRequest;
  }) {
    return request<TopicResponse>({
      apiKey,
      method: 'PATCH',
      path: `/topics/${topicId}`,
      body,
    });
  },

  deleteTopic({ apiKey, topicId }: { apiKey: string; topicId: string }) {
    return request<StatusResponse>({
      apiKey,
      method: 'DELETE',
      path: `/topics/${topicId}`,
    });
  },

  createFile({ apiKey, body }: { apiKey: string; body: FileCreateRequest }) {
    return request<FileCreateResponse>({
      apiKey,
      method: 'POST',
      path: '/library/files',
      body,
    });
  },

  uploadMedia({
    apiKey,
    businessId,
    altText,
    file,
    filename,
  }: {
    apiKey: string;
    businessId: string;
    altText?: string;
    file: Buffer;
    filename: string;
  }) {
    const formData = new FormData();
    formData.append('file', new Blob([file]), filename);
    const query = buildQuery({ business_id: businessId, alt_text: altText });
    return multipartRequest<MediaResponse>({
      apiKey,
      path: `/media${query}`,
      formData,
    });
  },

  registerWebhook({
    apiKey,
    url,
    events,
  }: {
    apiKey: string;
    url: string;
    events: string[];
  }) {
    return request<WebhookResponse>({
      apiKey,
      method: 'POST',
      path: '/webhooks',
      body: { url, events },
    });
  },

  deleteWebhook({ apiKey, webhookId }: { apiKey: string; webhookId: string }) {
    return request<StatusResponse>({
      apiKey,
      method: 'DELETE',
      path: `/webhooks/${webhookId}`,
    });
  },
};

const BASE_URL = 'https://api.mymarky.ai/api';

async function request<T>({
  apiKey,
  method,
  path,
  body,
}: {
  apiKey: string;
  method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  path: string;
  body?: unknown;
}): Promise<MarkyResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  return parseResponse<T>(response);
}

async function multipartRequest<T>({
  apiKey,
  path,
  formData,
}: {
  apiKey: string;
  path: string;
  formData: FormData;
}): Promise<MarkyResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: 'application/json',
    },
    body: formData,
  });

  return parseResponse<T>(response);
}

async function parseResponse<T>(response: Response): Promise<MarkyResponse<T>> {
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    return { ok: false, status: response.status, message };
  }

  const data: T = await response.json();
  return { ok: true, data };
}

function buildQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, value]) => value !== undefined && value !== '',
  );
  if (entries.length === 0) return '';
  const searchParams = new URLSearchParams();
  for (const [key, value] of entries) {
    searchParams.set(key, String(value));
  }
  return `?${searchParams.toString()}`;
}

export { markyClient };

export type MarkyResponse<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; message: string };

export type BusinessResponse = {
  id: string;
  title: string | null;
  description: string | null;
  industry: string | null;
  website: string | null;
  language: string;
  created_at: string;
  updated_at: string | null;
};

export type PostStatus = 'NEW' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED' | 'DRAFT';

export type PostResponse = {
  id: string;
  business_id: string;
  caption: string | null;
  status: string | null;
  media_urls: string[] | null;
  publish_to: string[] | null;
  adhoc_publish_time: string | null;
  published_at: string | null;
  created_at: string;
  updated_at: string | null;
};

export type PostCreateRequest = {
  business_id: string;
  caption: string;
  publish_to?: string[];
  media_urls?: string[];
  status?: 'NEW' | 'SCHEDULED';
  adhoc_publish_time?: string;
};

export type PostUpdateRequest = {
  caption?: string;
  publish_to?: string[];
};

export type PostScheduleRequest = {
  publish_at: string;
  publish_to?: string[];
};

export type CursorPage<T> = {
  data: T[];
  has_more: boolean;
  next_cursor: string | null;
};

export type TopicResponse = {
  id: string;
  business_id: string;
  title: string;
  body: string | null;
  enabled: boolean;
  category_id: string | null;
  created_at: string;
  updated_at: string | null;
};

export type TopicCreateRequest = {
  business_id: string;
  title: string;
  body?: string;
  category_id?: string;
  enabled?: boolean;
};

export type TopicUpdateRequest = {
  title?: string;
  body?: string;
  category_id?: string;
  enabled?: boolean;
};

export type FileCreateRequest = {
  business_id: string;
  path: string;
  content: string;
};

export type FileCreateResponse = {
  id: string;
  path: string;
};

export type MediaResponse = {
  id: string;
  business_id: string;
  alt_text: string | null;
  original_url: string | null;
  type: string | null;
  width: number | null;
  height: number | null;
  source: string | null;
  created_at: string;
};

export type WebhookResponse = {
  id: string;
  url: string;
  events: string[];
  org_id: string;
  secret: string | null;
  created_at: string;
};

export type StatusResponse = {
  status: string;
};
