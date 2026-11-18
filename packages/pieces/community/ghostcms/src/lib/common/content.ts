import { HttpMethod } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';
import { GhostAuthValue, ghostClient, ghostCommon } from './client';
import { ghostProps } from './ai-props';
import { applyClearFields, clearFieldsProp } from './clear-fields';

export type GhostContentResource = 'posts' | 'pages';

type ContentItem = Record<string, unknown> & { id: string; updated_at: string; status?: string };

const CONTENT_QUERY = { formats: 'html', include: 'tags,authors' };

const visibility = Property.StaticDropdown({
  displayName: 'Visibility',
  description: 'Who can read the content on the site.',
  required: false,
  options: {
    options: [
      { label: 'Public', value: 'public' },
      { label: 'Members only', value: 'members' },
      { label: 'Paid members only', value: 'paid' },
    ],
  },
});

export const contentProps = ({ label, mode }: { label: 'post' | 'page'; mode: 'create' | 'update' }) => ({
  title: Property.ShortText({
    displayName: 'Title',
    description: `The ${label} title.`,
    required: mode === 'create',
  }),
  html: Property.LongText({
    displayName: 'Content (HTML)',
    description: `The ${label} body as HTML. Ghost converts it to its editor format.${
      mode === 'update' ? ' Supplying it replaces the whole body.' : ''
    }`,
    required: false,
  }),
  slug: Property.ShortText({
    displayName: 'Slug',
    description: `The URL slug of the ${label}. Ghost generates one from the title when empty.`,
    required: false,
  }),
  custom_excerpt: Property.LongText({
    displayName: 'Excerpt',
    description: 'A short summary shown in lists and previews.',
    required: false,
  }),
  feature_image: Property.ShortText({
    displayName: 'Feature Image URL',
    description: 'The URL of the feature image, for example one returned by Upload Image.',
    required: false,
  }),
  featured: ghostProps.triState('Featured', `Mark the ${label} as featured.`),
  visibility,
  tags: Property.Array({
    displayName: 'Tags',
    description: `Tag names. Missing tags are created.${
      mode === 'update' ? ' Supplying tags replaces the full tag list; an empty list removes every tag, and leaving it out keeps the current tags.' : ''
    }`,
    required: false,
  }),
  authors: Property.Array({
    displayName: 'Authors',
    description: `Staff user IDs or emails, from List Users.${
      mode === 'update'
        ? ' Supplying authors replaces the full author list. Ghost needs at least one author, so an empty list is rejected.'
        : ' Defaults to the integration owner.'
    }`,
    required: false,
  }),
  meta_title: Property.ShortText({
    displayName: 'Meta Title',
    description: 'The SEO title.',
    required: false,
  }),
  meta_description: Property.LongText({
    displayName: 'Meta Description',
    description: 'The SEO description.',
    required: false,
  }),
  ...(mode === 'update' ? { clear_fields: clearFieldsProp(CLEARABLE_CONTENT_FIELDS) } : {}),
});

const CLEARABLE_CONTENT_FIELDS = [
  { label: 'Excerpt', value: 'custom_excerpt' },
  { label: 'Feature Image URL', value: 'feature_image' },
  { label: 'Meta Title', value: 'meta_title' },
  { label: 'Meta Description', value: 'meta_description' },
];

export const ghostContent = {
  strip<T extends Record<string, unknown>>(item: T): T {
    const copy = { ...item };
    delete copy['lexical'];
    delete copy['mobiledoc'];
    return copy;
  },
  body(props: Record<string, unknown>): Record<string, unknown> {
    const body: Record<string, unknown> = {};
    for (const key of ['title', 'html', 'slug', 'custom_excerpt', 'feature_image', 'meta_title', 'meta_description']) {
      const value = props[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        body[key] = key === 'html' ? value : value.trim();
      }
    }
    const featured = ghostCommon.triState(props['featured']);
    if (featured !== undefined) {
      body['featured'] = featured;
    }
    if (ghostCommon.hasText(props['visibility'])) {
      body['visibility'] = props['visibility'];
    }
    const rawTags = props['tags'];
    const tags = ghostCommon.stringList(rawTags);
    if (tags) {
      body['tags'] = tags.map((name) => ({ name }));
    } else if (Array.isArray(rawTags)) {
      body['tags'] = [];
    }
    const rawAuthors = props['authors'];
    const authors = ghostCommon.stringList(rawAuthors);
    if (authors) {
      body['authors'] = authors.map((value) => (value.includes('@') ? { email: value } : { id: value }));
    } else if (Array.isArray(rawAuthors)) {
      throw new Error('Ghost requires at least one author. Leave Authors out to keep the current authors, or pass the staff user IDs or emails you want.');
    }
    return applyClearFields({
      body,
      clear: props['clear_fields'],
      allowed: CLEARABLE_CONTENT_FIELDS.map((field) => field.value),
      clearValue: null,
    });
  },
  async list(
    auth: GhostAuthValue,
    resource: GhostContentResource,
    props: { filter?: string | null; limit?: number | null; page?: number | null; order?: string | null; include_content?: boolean | null }
  ) {
    const response = await ghostClient.request<Record<string, unknown>>({
      auth,
      method: HttpMethod.GET,
      path: `/${resource}`,
      query: {
        ...ghostCommon.listQuery(props),
        include: 'tags,authors',
        formats: props.include_content ? 'html' : undefined,
      },
    });
    const items = ghostCommon.records(response[resource]).map((item) => {
      const stripped = ghostContent.strip(item);
      if (!props.include_content) {
        delete stripped['html'];
      }
      return stripped;
    });
    return { [resource]: items, ...ghostCommon.pagination(response['meta']) };
  },
  async get(auth: GhostAuthValue, resource: GhostContentResource, path: string): Promise<ContentItem> {
    const response = await ghostClient.request<Record<string, ContentItem[]>>({
      auth,
      method: HttpMethod.GET,
      path: `/${resource}/${path}`,
      query: CONTENT_QUERY,
    });
    return ghostContent.strip(ghostCommon.first(response[resource], resource));
  },
  async create(auth: GhostAuthValue, resource: GhostContentResource, body: Record<string, unknown>) {
    const response = await ghostClient.request<Record<string, ContentItem[]>>({
      auth,
      method: HttpMethod.POST,
      path: `/${resource}`,
      query: { ...CONTENT_QUERY, source: body['html'] !== undefined ? 'html' : undefined },
      body: { [resource]: [body] },
    });
    return ghostContent.strip(ghostCommon.first(response[resource], resource));
  },
  async edit(
    auth: GhostAuthValue,
    resource: GhostContentResource,
    id: string,
    changes: Record<string, unknown> | ((current: ContentItem) => Record<string, unknown>),
    query?: Record<string, string | undefined>
  ) {
    const current = await ghostContent.get(auth, resource, id);
    const body = typeof changes === 'function' ? changes(current) : changes;
    const response = await ghostClient.request<Record<string, ContentItem[]>>({
      auth,
      method: HttpMethod.PUT,
      path: `/${resource}/${id}`,
      query: { ...CONTENT_QUERY, source: body['html'] !== undefined ? 'html' : undefined, ...(query ?? {}) },
      body: { [resource]: [{ ...body, updated_at: current.updated_at }] },
    });
    return ghostContent.strip(ghostCommon.first(response[resource], resource));
  },
  async copy(auth: GhostAuthValue, resource: GhostContentResource, id: string) {
    const response = await ghostClient.request<Record<string, ContentItem[]>>({
      auth,
      method: HttpMethod.POST,
      path: `/${resource}/${id}/copy`,
      query: CONTENT_QUERY,
    });
    return ghostContent.strip(ghostCommon.first(response[resource], resource));
  },
  async remove(auth: GhostAuthValue, resource: GhostContentResource, id: string) {
    await ghostClient.request<unknown>({
      auth,
      method: HttpMethod.DELETE,
      path: `/${resource}/${id}`,
    });
  },
};
