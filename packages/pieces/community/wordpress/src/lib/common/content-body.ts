import { QueryParams } from '@activepieces/pieces-common';
import { Property } from '@activepieces/pieces-framework';

function isFilledText(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

function isSetNumber(value: number | null | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function requireWholeNumber({
  value,
  propName,
}: {
  value: number;
  propName: string;
}): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${propName} must be a whole-number ID; got "${value}".`);
  }
  return value;
}

function parseIdList({
  values,
  propName,
}: {
  values: unknown[] | null | undefined;
  propName: string;
}): number[] | undefined {
  if (!Array.isArray(values) || values.length === 0) {
    return undefined;
  }
  return values.map((item) => {
    const parsed = typeof item === 'string' ? Number(item.trim()) : item;
    if (typeof parsed !== 'number' || !Number.isInteger(parsed) || parsed <= 0) {
      throw new Error(
        `${propName} must contain whole-number IDs only; got "${String(item)}".`
      );
    }
    return parsed;
  });
}

function parseStringList({
  values,
}: {
  values: unknown[] | null | undefined;
}): string[] | undefined {
  if (!Array.isArray(values)) {
    return undefined;
  }
  const items = values
    .map((item) => String(item).trim())
    .filter((item) => item !== '');
  return items.length > 0 ? items : undefined;
}

function buildPaging({
  perPage,
  page,
}: {
  perPage: number | null | undefined;
  page: number | null | undefined;
}): QueryParams {
  const resolvedPerPage = isSetNumber(perPage) ? perPage : 10;
  const resolvedPage = isSetNumber(page) ? page : 1;
  if (
    !Number.isInteger(resolvedPerPage) ||
    resolvedPerPage < 1 ||
    resolvedPerPage > 100
  ) {
    throw new Error(
      `Results Per Page must be a whole number from 1 to 100; got "${resolvedPerPage}".`
    );
  }
  if (!Number.isInteger(resolvedPage) || resolvedPage < 1) {
    throw new Error(
      `Page must be a whole number of 1 or more; got "${resolvedPage}".`
    );
  }
  return { per_page: String(resolvedPerPage), page: String(resolvedPage) };
}

function addText({
  target,
  key,
  value,
}: {
  target: Record<string, unknown>;
  key: string;
  value: string | null | undefined;
}): void {
  if (isFilledText(value)) {
    target[key] = value;
  }
}

function addNumber({
  target,
  key,
  value,
  propName,
}: {
  target: Record<string, unknown>;
  key: string;
  value: number | null | undefined;
  propName: string;
}): void {
  if (isSetNumber(value)) {
    target[key] = requireWholeNumber({ value, propName });
  }
}

function buildContentBody({
  kind,
  values,
}: {
  kind: 'post' | 'page';
  values: ContentValues;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  addText({ target: body, key: 'title', value: values.title });
  addText({ target: body, key: 'content', value: values.content });
  addText({ target: body, key: 'status', value: values.status });
  addText({ target: body, key: 'date', value: values.date });
  addText({ target: body, key: 'slug', value: values.slug });
  addText({ target: body, key: 'comment_status', value: values.comment_status });
  addText({ target: body, key: 'ping_status', value: values.ping_status });
  addNumber({
    target: body,
    key: 'featured_media',
    value: values.featured_media,
    propName: 'Featured Media ID',
  });
  addNumber({ target: body, key: 'author', value: values.author, propName: 'Author ID' });
  addText({ target: body, key: 'excerpt', value: values.excerpt });
  if (kind === 'post') {
    addText({ target: body, key: 'format', value: values.format });
    if (values.sticky === 'true' || values.sticky === 'false') {
      body['sticky'] = values.sticky === 'true';
    }
    const categories = parseIdList({ values: values.categories, propName: 'Category IDs' });
    if (categories) {
      body['categories'] = categories;
    }
    const tags = parseIdList({ values: values.tags, propName: 'Tag IDs' });
    if (tags) {
      body['tags'] = tags;
    }
    if (values.acf && Object.keys(values.acf).length > 0) {
      body['acf'] = values.acf;
    }
  }
  if (kind === 'page') {
    addNumber({ target: body, key: 'parent', value: values.parent, propName: 'Parent Page ID' });
    if (isSetNumber(values.menu_order)) {
      if (!Number.isInteger(values.menu_order)) {
        throw new Error(`Menu Order must be a whole number; got "${values.menu_order}".`);
      }
      body['menu_order'] = values.menu_order;
    }
  }
  return body;
}

function requireDateForFuture({ values }: { values: ContentValues }): void {
  if (values.status === 'future' && !isFilledText(values.date)) {
    throw new Error(
      'Status "future" needs a Publish Date in the future (ISO 8601, e.g. 2030-01-31T09:00:00).'
    );
  }
}

function buildMediaDetailsBody({
  values,
}: {
  values: MediaDetailsValues;
}): Record<string, unknown> {
  const body: Record<string, unknown> = {};
  addText({ target: body, key: 'title', value: values.title });
  addText({ target: body, key: 'alt_text', value: values.alt_text });
  addText({ target: body, key: 'caption', value: values.caption });
  addText({ target: body, key: 'description', value: values.description });
  addNumber({ target: body, key: 'post', value: values.post, propName: 'Attached Post ID' });
  return body;
}

function requirePatch({ body }: { body: Record<string, unknown> }): void {
  if (Object.keys(body).length === 0) {
    throw new Error(
      'Nothing to update: supply at least one field to change. Empty text fields are treated as "leave unchanged".'
    );
  }
}

const openClosedOptions = {
  disabled: false,
  options: [
    { label: 'Open', value: 'open' },
    { label: 'Closed', value: 'closed' },
  ],
};

const trueFalseOptions = {
  disabled: false,
  options: [
    { label: 'Yes', value: 'true' },
    { label: 'No', value: 'false' },
  ],
};

const contentStatusOptions = {
  disabled: false,
  options: [
    { label: 'Publish', value: 'publish' },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending Review', value: 'pending' },
    { label: 'Private', value: 'private' },
    { label: 'Scheduled (future)', value: 'future' },
  ],
};

const postFormatOptions = {
  disabled: false,
  options: [
    { label: 'Standard', value: 'standard' },
    { label: 'Aside', value: 'aside' },
    { label: 'Chat', value: 'chat' },
    { label: 'Gallery', value: 'gallery' },
    { label: 'Link', value: 'link' },
    { label: 'Image', value: 'image' },
    { label: 'Quote', value: 'quote' },
    { label: 'Status', value: 'status' },
    { label: 'Video', value: 'video' },
    { label: 'Audio', value: 'audio' },
  ],
};

const orderOptions = {
  disabled: false,
  options: [
    { label: 'Descending', value: 'desc' },
    { label: 'Ascending', value: 'asc' },
  ],
};

function contentProps({
  kind,
  mode,
}: {
  kind: 'post' | 'page';
  mode: 'create' | 'update';
}) {
  const required = mode === 'create';
  const noun = kind === 'post' ? 'post' : 'page';
  const unchanged = mode === 'update' ? ' Leave empty to keep the current value.' : '';
  return {
    title: Property.ShortText({
      displayName: 'Title',
      description: `The ${noun} title.${unchanged}`,
      required,
    }),
    content: Property.LongText({
      displayName: 'Content',
      description: `The ${noun} body as HTML.${unchanged}`,
      required,
    }),
    status: Property.StaticDropdown({
      displayName: 'Status',
      description:
        mode === 'create'
          ? `Leave empty to save the ${noun} as a draft. "Scheduled (future)" needs a Publish Date.`
          : `New status.${unchanged} To trash the ${noun}, use the trash action instead.`,
      required: false,
      options: contentStatusOptions,
    }),
    date: Property.ShortText({
      displayName: 'Publish Date',
      description: `Publish date in the site's timezone, ISO 8601 (e.g. 2030-01-31T09:00:00). A past date with status "future" publishes immediately.${unchanged}`,
      required: false,
    }),
    slug: Property.ShortText({
      displayName: 'Slug',
      description: `URL slug.${unchanged}`,
      required: false,
    }),
    featured_media: Property.Number({
      displayName: 'Featured Media ID',
      description: `ID of an uploaded image to use as the featured image. Get it from upload_media or list_media.${unchanged}`,
      required: false,
    }),
    author: Property.Number({
      displayName: 'Author ID',
      description: `User ID of the author. Get it from list_users or get_current_user. Leave empty for the connected user.`,
      required: false,
    }),
    comment_status: Property.StaticDropdown({
      displayName: 'Comments',
      description: `Whether visitors can comment.${unchanged}`,
      required: false,
      options: openClosedOptions,
    }),
    ping_status: Property.StaticDropdown({
      displayName: 'Pingbacks',
      description: `Whether the ${noun} accepts pingbacks and trackbacks.${unchanged}`,
      required: false,
      options: openClosedOptions,
    }),
  };
}

function postOnlyProps({ mode }: { mode: 'create' | 'update' }) {
  const unchanged = mode === 'update' ? ' Leave empty to keep the current value.' : '';
  const replaces = mode === 'update' ? ' The list replaces the post\'s current set.' : '';
  return {
    excerpt: Property.LongText({
      displayName: 'Excerpt',
      description: `Short summary of the post.${unchanged}`,
      required: false,
    }),
    categories: Property.Array({
      displayName: 'Category IDs',
      description: `Category IDs from list_categories or create_category.${replaces}${unchanged}`,
      required: false,
    }),
    tags: Property.Array({
      displayName: 'Tag IDs',
      description: `Tag IDs from list_tags or create_tag.${replaces}${unchanged}`,
      required: false,
    }),
    sticky: Property.StaticDropdown({
      displayName: 'Sticky',
      description: `Whether the post is pinned to the top of the blog.${unchanged}`,
      required: false,
      options: trueFalseOptions,
    }),
    format: Property.StaticDropdown({
      displayName: 'Format',
      description: `Post format. Only formats the active theme supports are accepted.${unchanged}`,
      required: false,
      options: postFormatOptions,
    }),
    acf: Property.Object({
      displayName: 'Custom ACF Fields',
      description: `Advanced Custom Fields values as field name and value pairs; field names come from the ACF plugin menu. Only the fields you supply are written. Requires the site to expose ACF over the REST API.${unchanged}`,
      required: false,
    }),
  };
}

function pageOnlyProps({ mode }: { mode: 'create' | 'update' }) {
  const unchanged = mode === 'update' ? ' Leave empty to keep the current value.' : '';
  return {
    excerpt: Property.LongText({
      displayName: 'Excerpt',
      description: `Short summary of the page. Takes effect only when the theme or site supports page excerpts; WordPress silently ignores it otherwise.${unchanged}`,
      required: false,
    }),
    parent: Property.Number({
      displayName: 'Parent Page ID',
      description: `ID of the parent page, from list_pages.${unchanged}`,
      required: false,
    }),
    menu_order: Property.Number({
      displayName: 'Menu Order',
      description: `Position of the page among its siblings.${unchanged}`,
      required: false,
    }),
  };
}

function pagingProps() {
  return {
    per_page: Property.Number({
      displayName: 'Results Per Page',
      description: 'How many results to return, from 1 to 100. Defaults to 10.',
      required: false,
      defaultValue: 10,
    }),
    page: Property.Number({
      displayName: 'Page',
      description: 'Page of results to return, starting at 1. The output reports total_pages.',
      required: false,
      defaultValue: 1,
    }),
  };
}

export const wordpressContent = {
  isFilledText,
  isSetNumber,
  requireWholeNumber,
  parseIdList,
  parseStringList,
  buildPaging,
  buildContentBody,
  requireDateForFuture,
  buildMediaDetailsBody,
  requirePatch,
  contentProps,
  postOnlyProps,
  pageOnlyProps,
  pagingProps,
  openClosedOptions,
  trueFalseOptions,
  orderOptions,
};

export type ContentValues = {
  title?: string | null;
  content?: string | null;
  status?: string | null;
  date?: string | null;
  slug?: string | null;
  featured_media?: number | null;
  author?: number | null;
  comment_status?: string | null;
  ping_status?: string | null;
  excerpt?: string | null;
  categories?: unknown[] | null;
  tags?: unknown[] | null;
  sticky?: string | null;
  format?: string | null;
  acf?: Record<string, unknown> | null;
  parent?: number | null;
  menu_order?: number | null;
};

export type MediaDetailsValues = {
  title?: string | null;
  alt_text?: string | null;
  caption?: string | null;
  description?: string | null;
  post?: number | null;
};
