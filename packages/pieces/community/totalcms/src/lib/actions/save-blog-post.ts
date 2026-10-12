import { createAction, Property } from '@activepieces/pieces-framework';
import { cmsAuth } from '../auth';
import { totalcmsApi } from '../common/client';
import { totalcmsProps } from '../common/props';
import { totalcmsShape } from '../common/shape';
import { totalcmsOutputSchemas } from '../output-schemas';

export const saveBlogPostAction = createAction({
  name: 'save_blog_post',
  classification: 'WRITE',
  auth: cmsAuth,
  displayName: 'Create or Update Blog Post',
  description: 'Creates a blog post, or updates the post with the given ID.',
  audience: 'both',
  aiMetadata: {
    description:
      'Creates a Total CMS blog post, or updates only the fields you pass on an existing post when Post ID matches one. Leave Post ID empty to create a post whose ID is made from the title. Creating twice with an empty Post ID fails on the duplicate ID; updates are safe to repeat.',
    idempotent: false,
  },
  props: {
    collection: totalcmsProps.collectionForSchema({ schema: 'blog', label: 'Blog' }),
    post_id: totalcmsProps.objectIdText({
      displayName: 'Post ID',
      description:
        'The post ID (URL slug), for example my-first-post. If a post with this ID exists it is updated, otherwise a new post is created. Leave empty to create a new post with an ID made from the title.',
      required: false,
    }),
    title: Property.ShortText({
      displayName: 'Title',
      description: 'Required when creating a post.',
      required: false,
    }),
    date: Property.DateTime({
      displayName: 'Date',
      description: 'The publication date. Defaults to now for new posts.',
      required: false,
    }),
    author: Property.ShortText({ displayName: 'Author', required: false }),
    summary: Property.LongText({ displayName: 'Summary', description: 'HTML is allowed.', required: false }),
    content: Property.LongText({ displayName: 'Content', description: 'The post body. HTML is allowed.', required: false }),
    extra: Property.LongText({ displayName: 'Extra Content', description: 'HTML is allowed.', required: false }),
    media: Property.ShortText({
      displayName: 'Media URL',
      description: 'A link to related media, such as a video or podcast episode.',
      required: false,
    }),
    categories: Property.ShortText({
      displayName: 'Categories',
      description:
        'Replaces the post categories. Separate them with commas, or map a list. Use a JSON list such as ["News, Events"] when a name contains a comma. Leave empty to keep the current ones.',
      required: false,
    }),
    tags: Property.ShortText({
      displayName: 'Tags',
      description:
        'Replaces the post tags. Separate them with commas, or map a list. Use a JSON list such as ["News, Events"] when a name contains a comma. Leave empty to keep the current ones.',
      required: false,
    }),
    draft: Property.StaticDropdown({
      displayName: 'Status',
      description: 'Leave empty to keep the current status (new posts are published).',
      required: false,
      options: {
        options: [
          { label: 'Published', value: 'published' },
          { label: 'Draft', value: 'draft' },
        ],
      },
    }),
    featured: Property.StaticDropdown({
      displayName: 'Featured',
      description: 'Leave empty to keep the current value.',
      required: false,
      options: {
        options: [
          { label: 'Yes', value: 'yes' },
          { label: 'No', value: 'no' },
        ],
      },
    }),
  },
  outputSchema: totalcmsOutputSchemas.savedBlogPost,
  async run(context) {
    const { propsValue, auth } = context;
    const collection = totalcmsShape.requireId({ value: propsValue.collection, label: 'Collection ID' });
    const fields = buildFields({ propsValue });
    const postId = typeof propsValue.post_id === 'string' ? propsValue.post_id.trim() : '';
    const existing = postId ? await totalcmsApi.findObject({ auth, collection, id: postId }) : null;
    if (existing) {
      if (Object.keys(fields).length === 0) {
        throw new Error('Nothing to update. Fill in at least one field to change.');
      }
      const object = await totalcmsApi.patchObject({ auth, collection, id: postId, fields });
      return { result: 'updated', ...totalcmsShape.typed({ collection, object }) };
    }
    if (typeof fields['title'] !== 'string') {
      throw new Error('Title is required to create a new blog post.');
    }
    const object = await totalcmsApi.createObject({
      auth,
      collection,
      fields: postId ? { id: postId, draft: false, ...fields } : { draft: false, ...fields },
    });
    return { result: 'created', ...totalcmsShape.typed({ collection, object }) };
  },
});

const TEXT_KEYS: TextKey[] = ['title', 'author', 'summary', 'content', 'extra', 'media'];
const LIST_KEYS: ListKey[] = ['categories', 'tags'];

function buildFields({ propsValue }: { propsValue: BlogPostProps }): Record<string, unknown> {
  const textEntries = TEXT_KEYS.flatMap((key) => {
    const value = propsValue[key];
    return typeof value === 'string' && value.trim().length > 0 ? [[key, value]] : [];
  });
  const listEntries = LIST_KEYS.flatMap((key) => {
    const list = toStringList({ value: propsValue[key] });
    return list.length > 0 ? [[key, list]] : [];
  });
  const fields: Record<string, unknown> = Object.fromEntries([...textEntries, ...listEntries]);
  if (propsValue.date !== undefined && propsValue.date !== null && String(propsValue.date).length > 0) {
    const date = new Date(String(propsValue.date));
    if (Number.isNaN(date.getTime())) {
      throw new Error('Date is not a valid date. Use a format such as 2026-12-31T18:00:00Z.');
    }
    fields['date'] = date.toISOString();
  }
  if (propsValue.media && !/^https?:\/\//i.test(propsValue.media.trim())) {
    throw new Error('Media URL must start with http:// or https://.');
  }
  if (propsValue.draft === 'draft' || propsValue.draft === 'published') {
    fields['draft'] = propsValue.draft === 'draft';
  }
  if (propsValue.featured === 'yes' || propsValue.featured === 'no') {
    fields['featured'] = propsValue.featured === 'yes';
  }
  return fields;
}

function toStringList({ value }: { value: unknown }): string[] {
  const list = typeof value === 'string' ? listFromString({ text: value }) : value;
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .flatMap((item) => (typeof item === 'string' ? [item] : typeof item === 'number' ? [String(item)] : []))
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function listFromString({ text }: { text: string }): unknown[] {
  const trimmed = text.trim();
  const parsed = trimmed.startsWith('[') ? parseJsonArray({ text: trimmed }) : null;
  return parsed ?? trimmed.split(',');
}

function parseJsonArray({ text }: { text: string }): unknown[] | null {
  try {
    const parsed: unknown = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

type BlogPostProps = {
  title?: string;
  author?: string;
  summary?: string;
  content?: string;
  extra?: string;
  media?: string;
  categories?: string;
  tags?: string;
  date?: string;
  draft?: string;
  featured?: string;
};

type TextKey = 'title' | 'author' | 'summary' | 'content' | 'extra' | 'media';

type ListKey = 'categories' | 'tags';
