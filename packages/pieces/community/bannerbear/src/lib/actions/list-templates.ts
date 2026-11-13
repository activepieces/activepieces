import { createAction, Property } from '@activepieces/pieces-framework';
import { HttpMethod, QueryParams } from '@activepieces/pieces-common';
import { bannerbearAuth } from '../auth';
import { bannerbearClient, RawTemplate } from '../common/client';
import { bannerbearOutputSchemas } from '../output-schemas';

export const listTemplatesAction = createAction({
  auth: bannerbearAuth,
  name: 'list_templates',
  classification: 'SEARCH',
  displayName: 'List Templates',
  description: 'List image templates, optionally filtered by name or tag.',
  audience: 'both',
  aiMetadata: {
    description:
      'List Bannerbear image templates with their IDs, optionally filtered by name or tag. Use it to find a template ID for Create Image from JSON, then Get Template for its layers. Read-only.',
    idempotent: true,
  },
  outputSchema: bannerbearOutputSchemas['listTemplates'],
  props: {
    name: Property.ShortText({
      displayName: 'Name Contains',
      description: 'Only templates whose name contains this text.',
      required: false,
    }),
    tag: Property.ShortText({
      displayName: 'Tag',
      description: 'Only templates with this tag.',
      required: false,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page number, starting at 1.',
      required: false,
      defaultValue: 1,
    }),
  },
  async run({ auth, propsValue }) {
    const apiKey = auth.secret_text;
    const page = bannerbearClient.clampPage(propsValue.page);
    const name = propsValue.name?.trim() ?? '';
    const tag = propsValue.tag?.trim() ?? '';
    if (bannerbearClient.getVersion(apiKey) === 'v5') {
      if (name === '' && tag === '') {
        const raw = await bannerbearClient.request<RawTemplate[]>({
          apiKey,
          method: HttpMethod.GET,
          path: '/image_templates',
          queryParams: { page: String(page) },
        });
        return {
          items: raw.map((t) => toListItem(bannerbearClient.normalizeTemplate(t))),
          page,
          has_more: raw.length >= V5_PAGE_SIZE,
        };
      }
      const all = await bannerbearClient.listAllTemplates(apiKey);
      const filtered = all.filter(
        (t) =>
          (name === '' ||
            (t.name ?? '').toLowerCase().includes(name.toLowerCase())) &&
          (tag === '' || t.tags.includes(tag))
      );
      const start = (page - 1) * V5_PAGE_SIZE;
      return {
        items: filtered.slice(start, start + V5_PAGE_SIZE).map((t) => toListItem(t)),
        page,
        has_more: filtered.length > start + V5_PAGE_SIZE,
      };
    }
    const queryParams: QueryParams = {
      page: String(page),
      limit: String(bannerbearClient.MAX_LIMIT),
    };
    if (name !== '') queryParams['name'] = name;
    if (tag !== '') queryParams['tag'] = tag;
    const raw = await bannerbearClient.request<RawTemplate[]>({
      apiKey,
      method: HttpMethod.GET,
      path: '/templates',
      queryParams,
    });
    return {
      items: raw.map((t) => toListItem(bannerbearClient.normalizeTemplate(t))),
      page,
      has_more: raw.length >= bannerbearClient.MAX_LIMIT,
    };
  },
});

function toListItem(t: {
  uid: string;
  name: string | null;
  width: number | null;
  height: number | null;
  preview_url: string | null;
  tags: string[];
  created_at: string | null;
}) {
  return {
    uid: t.uid,
    name: t.name,
    width: t.width,
    height: t.height,
    preview_url: t.preview_url,
    tags: t.tags,
    created_at: t.created_at,
  };
}

const V5_PAGE_SIZE = 25;
