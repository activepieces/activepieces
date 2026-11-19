import { HttpMethod } from '@activepieces/pieces-common';
import { OutputSchema, Property } from '@activepieces/pieces-framework';
import { listIntegrations, postizApiCall, PostizAuth, requireText, withUtcOffset } from './index';

function parseDate({ value, label }: { value: unknown; label: string }): string | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  if (typeof value !== 'string' && typeof value !== 'number') {
    throw new Error(`${label} must be an ISO 8601 date.`);
  }
  const parsed = new Date(typeof value === 'string' ? withUtcOffset({ value }) : value);
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`${label} must be an ISO 8601 date, got "${String(value)}".`);
  }
  return parsed.toISOString();
}

function parseSettings({ value }: { value: unknown }): Record<string, unknown> {
  if (value === undefined || value === null || value === '') {
    return {};
  }
  const parsed: unknown = typeof value === 'string' ? parseJson({ text: value }) : value;
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Settings must be a JSON object.');
  }
  return { ...parsed };
}

function parseJson({ text }: { text: string }): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new Error('Settings must be valid JSON.');
  }
}

function parseMediaEntries({ value }: { value: unknown }): string[] {
  if (value === undefined || value === null) {
    return [];
  }
  const items = Array.isArray(value) ? value : [value];
  return items
    .map((item) => (typeof item === 'string' ? item.trim() : typeof item === 'number' ? String(item) : ''))
    .filter((item) => item.length > 0);
}

async function resolveMedia({
  auth,
  entries,
}: {
  auth: PostizAuth;
  entries: string[];
}): Promise<PostizMediaRef[]> {
  if (entries.length === 0) {
    return [];
  }
  const found = new Map<string, PostizMediaRef>();
  const wanted = new Set(entries);
  for (let page = 1; page <= MAX_MEDIA_PAGES; page++) {
    const response = await postizApiCall<{ pages?: number; results?: { id: string; path: string }[] }>({
      auth,
      method: HttpMethod.GET,
      path: '/media',
      queryParams: { page: String(page) },
    });
    const results = response.body.results ?? [];
    for (const item of results) {
      const ref = { id: item.id, path: item.path };
      if (wanted.has(item.id)) {
        found.set(item.id, ref);
      }
      if (wanted.has(item.path)) {
        found.set(item.path, ref);
      }
    }
    const allFound = entries.every((entry) => found.has(entry));
    const totalPages = response.body.pages ?? 1;
    if (allFound || page >= totalPages || results.length === 0) {
      break;
    }
  }
  const missing = entries.filter((entry) => !found.has(entry));
  if (missing.length > 0) {
    throw new Error(
      `Media not found in the Postiz media library: ${missing.join(', ')}. Use the ID or path returned by Upload File from URL or List Media.`,
    );
  }
  return entries.flatMap((entry) => {
    const ref = found.get(entry);
    return ref ? [ref] : [];
  });
}

async function resolveProviderType({
  auth,
  integrationId,
}: {
  auth: PostizAuth;
  integrationId: string;
}): Promise<string> {
  const integrations = await listIntegrations({ auth });
  const match = integrations.find((integration) => integration.id === integrationId);
  if (!match) {
    throw new Error(`Channel "${integrationId}" was not found. Use List Channels to get a valid channel ID.`);
  }
  return match.identifier;
}

function buildCreatePostBody({
  type,
  date,
  integrationId,
  providerType,
  content,
  media,
  shortLink,
  settings,
}: {
  type: PostizPostType;
  date: string;
  integrationId: string;
  providerType: string | undefined;
  content: string;
  media: PostizMediaRef[];
  shortLink: boolean;
  settings: Record<string, unknown>;
}): Record<string, unknown> {
  const finalSettings = settings['__type'] === undefined && providerType
    ? { ...settings, __type: providerType }
    : settings;
  return {
    type,
    date,
    shortLink,
    tags: [],
    posts: [
      {
        integration: { id: integrationId },
        value: [{ content, image: media }],
        settings: finalSettings,
      },
    ],
  };
}

async function createPostizPost({
  auth,
  type,
  date,
  integrationId,
  content,
  media,
  shortLink,
  settings,
}: {
  auth: PostizAuth;
  type: PostizPostType;
  date: string | undefined;
  integrationId: string;
  content: string;
  media: unknown;
  shortLink: boolean;
  settings: unknown;
}): Promise<PostizCreatedPost[]> {
  const parsedSettings = parseSettings({ value: settings });
  const mediaRefs = await resolveMedia({ auth, entries: parseMediaEntries({ value: media }) });
  const providerType = parsedSettings['__type'] === undefined
    ? await resolveProviderType({ auth, integrationId })
    : undefined;
  const body = buildCreatePostBody({
    type,
    date: date ?? new Date().toISOString(),
    integrationId,
    providerType,
    content,
    media: mediaRefs,
    shortLink,
    settings: parsedSettings,
  });
  const response = await postizApiCall<PostizCreatedPost[]>({
    auth,
    method: HttpMethod.POST,
    path: '/posts',
    body,
  });
  return Array.isArray(response.body) ? response.body : [];
}

async function createAiPost({
  auth,
  type,
  date,
  propsValue,
}: {
  auth: PostizAuth;
  type: PostizPostType;
  date: string;
  propsValue: { channel_id?: unknown; content?: unknown; media?: unknown; settings?: unknown };
}): Promise<AiCreatedPost> {
  const integrationId = requireText({ value: propsValue.channel_id, label: 'Channel ID' });
  const results = await createPostizPost({
    auth,
    type,
    date,
    integrationId,
    content: requireText({ value: propsValue.content, label: 'Content' }),
    media: propsValue.media,
    shortLink: false,
    settings: propsValue.settings,
  });
  const created = results[0];
  if (!created) {
    throw new Error('Postiz did not return the created post.');
  }
  return {
    post_id: created.postId,
    integration_id: created.integration ?? integrationId,
    type,
    publish_date: date,
  };
}

function aiPostProps() {
  return {
    channel_id: Property.ShortText({
      displayName: 'Channel ID',
      description: 'ID of the connected channel, from List Channels.',
      required: true,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: 'Text of the post.',
      required: true,
    }),
    media: Property.Array({
      displayName: 'Media',
      description: 'Media IDs or paths from Upload File from URL or List Media.',
      required: false,
    }),
    settings: Property.Json({
      displayName: 'Settings',
      description: 'Optional channel settings, see Get Channel Settings.',
      required: false,
    }),
  };
}

const aiCreatedPostOutputSchema: OutputSchema = {
  fields: [
    { key: 'post_id', label: 'Post ID' },
    { key: 'integration_id', label: 'Channel ID' },
    { key: 'type', label: 'Post Type' },
    { key: 'publish_date', label: 'Publish Date', format: 'datetime' },
  ],
};

const MAX_MEDIA_PAGES = 20;

export {
  parseDate,
  parseSettings,
  parseMediaEntries,
  resolveMedia,
  buildCreatePostBody,
  createPostizPost,
  createAiPost,
  aiPostProps,
  aiCreatedPostOutputSchema,
  MAX_MEDIA_PAGES,
};

export type PostizPostType = 'now' | 'schedule' | 'draft';

export type PostizMediaRef = { id: string; path: string };

export type PostizCreatedPost = { postId: string; integration: string };

export type AiCreatedPost = {
  post_id: string;
  integration_id: string;
  type: PostizPostType;
  publish_date: string;
};
