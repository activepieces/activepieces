import { OutputSchema } from '@activepieces/pieces-framework';

const renderedTextFields: OutputSchema['fields'] = [
  { key: 'rendered', label: 'Rendered', format: 'html' },
];

const renderedUrlFields: OutputSchema['fields'] = [
  { key: 'rendered', label: 'Rendered', format: 'url' },
];

const renderedBodyFields: OutputSchema['fields'] = [
  { key: 'rendered', label: 'Rendered', format: 'html' },
  { key: 'protected', label: 'Password Protected', format: 'boolean' },
];

export const createPostActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Post ID', value: 'body.id', format: 'number' },
    { key: 'title', label: 'Title', value: 'body.title', children: renderedTextFields },
    { key: 'link', label: 'Link', value: 'body.link', format: 'url' },
    { key: 'slug', label: 'Slug', value: 'body.slug' },
    { key: 'status', label: 'Status', value: 'body.status' },
    { key: 'type', label: 'Type', value: 'body.type' },
    { key: 'date', label: 'Published Date', value: 'body.date', format: 'datetime' },
    { key: 'date_gmt', label: 'Published Date (GMT)', value: 'body.date_gmt', format: 'datetime' },
    { key: 'modified', label: 'Modified Date', value: 'body.modified', format: 'datetime' },
    { key: 'modified_gmt', label: 'Modified Date (GMT)', value: 'body.modified_gmt', format: 'datetime' },
    { key: 'content', label: 'Content', value: 'body.content', children: renderedBodyFields },
    { key: 'excerpt', label: 'Excerpt', value: 'body.excerpt', children: renderedBodyFields },
    { key: 'guid', label: 'GUID', value: 'body.guid', children: renderedUrlFields },
    { key: 'author', label: 'Author ID', value: 'body.author', format: 'number' },
    { key: 'featured_media', label: 'Featured Media ID', value: 'body.featured_media', format: 'number' },
    { key: 'sticky', label: 'Sticky', value: 'body.sticky', format: 'boolean' },
    { key: 'format', label: 'Format', value: 'body.format' },
    {
      key: 'categories',
      label: 'Category IDs',
      value: 'body.categories',
      description: 'Category term IDs assigned to the post, as a list of numbers.',
    },
    {
      key: 'tags',
      label: 'Tag IDs',
      value: 'body.tags',
      description: 'Tag term IDs assigned to the post, as a list of numbers.',
    },
    { key: 'comment_status', label: 'Comment Status', value: 'body.comment_status' },
    { key: 'ping_status', label: 'Ping Status', value: 'body.ping_status' },
  ],
};

export const createPageActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Page ID', value: 'body.id', format: 'number' },
    { key: 'title', label: 'Title', value: 'body.title', children: renderedTextFields },
    { key: 'link', label: 'Link', value: 'body.link', format: 'url' },
    { key: 'slug', label: 'Slug', value: 'body.slug' },
    { key: 'status', label: 'Status', value: 'body.status' },
    { key: 'type', label: 'Type', value: 'body.type' },
    { key: 'date', label: 'Published Date', value: 'body.date', format: 'datetime' },
    { key: 'date_gmt', label: 'Published Date (GMT)', value: 'body.date_gmt', format: 'datetime' },
    { key: 'modified', label: 'Modified Date', value: 'body.modified', format: 'datetime' },
    { key: 'modified_gmt', label: 'Modified Date (GMT)', value: 'body.modified_gmt', format: 'datetime' },
    { key: 'content', label: 'Content', value: 'body.content', children: renderedBodyFields },
    { key: 'excerpt', label: 'Excerpt', value: 'body.excerpt', children: renderedBodyFields },
    { key: 'guid', label: 'GUID', value: 'body.guid', children: renderedUrlFields },
    { key: 'author', label: 'Author ID', value: 'body.author', format: 'number' },
    { key: 'featured_media', label: 'Featured Media ID', value: 'body.featured_media', format: 'number' },
    { key: 'parent', label: 'Parent Page ID', value: 'body.parent', format: 'number' },
    { key: 'menu_order', label: 'Menu Order', value: 'body.menu_order', format: 'number' },
    { key: 'comment_status', label: 'Comment Status', value: 'body.comment_status' },
    { key: 'ping_status', label: 'Ping Status', value: 'body.ping_status' },
  ],
};

export const getPostActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Post ID', value: 'body.id', format: 'number' },
    { key: 'title', label: 'Title', value: 'body.title', children: renderedTextFields },
    { key: 'link', label: 'Link', value: 'body.link', format: 'url' },
    { key: 'slug', label: 'Slug', value: 'body.slug' },
    { key: 'status', label: 'Status', value: 'body.status' },
    { key: 'type', label: 'Type', value: 'body.type' },
    { key: 'date', label: 'Published Date', value: 'body.date', format: 'datetime' },
    { key: 'date_gmt', label: 'Published Date (GMT)', value: 'body.date_gmt', format: 'datetime' },
    { key: 'modified', label: 'Modified Date', value: 'body.modified', format: 'datetime' },
    { key: 'modified_gmt', label: 'Modified Date (GMT)', value: 'body.modified_gmt', format: 'datetime' },
    { key: 'content', label: 'Content', value: 'body.content', children: renderedBodyFields },
    { key: 'excerpt', label: 'Excerpt', value: 'body.excerpt', children: renderedBodyFields },
    { key: 'guid', label: 'GUID', value: 'body.guid', children: renderedUrlFields },
    { key: 'author', label: 'Author ID', value: 'body.author', format: 'number' },
    { key: 'featured_media', label: 'Featured Media ID', value: 'body.featured_media', format: 'number' },
    { key: 'sticky', label: 'Sticky', value: 'body.sticky', format: 'boolean' },
    { key: 'format', label: 'Format', value: 'body.format' },
    {
      key: 'categories',
      label: 'Category IDs',
      value: 'body.categories',
      description: 'Category term IDs assigned to the post, as a list of numbers.',
    },
    {
      key: 'tags',
      label: 'Tag IDs',
      value: 'body.tags',
      description: 'Tag term IDs assigned to the post, as a list of numbers.',
    },
    { key: 'comment_status', label: 'Comment Status', value: 'body.comment_status' },
    { key: 'ping_status', label: 'Ping Status', value: 'body.ping_status' },
  ],
};

const postFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Post ID', format: 'number' },
  { key: 'title', label: 'Title', children: renderedTextFields },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'slug', label: 'Slug' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'date', label: 'Published Date', format: 'datetime' },
  { key: 'date_gmt', label: 'Published Date (GMT)', format: 'datetime' },
  { key: 'modified', label: 'Modified Date', format: 'datetime' },
  { key: 'modified_gmt', label: 'Modified Date (GMT)', format: 'datetime' },
  { key: 'content', label: 'Content', children: renderedBodyFields },
  { key: 'excerpt', label: 'Excerpt', children: renderedBodyFields },
  { key: 'guid', label: 'GUID', children: renderedUrlFields },
  { key: 'author', label: 'Author ID', format: 'number' },
  { key: 'featured_media', label: 'Featured Media ID', format: 'number' },
  { key: 'sticky', label: 'Sticky', format: 'boolean' },
  { key: 'format', label: 'Format' },
  {
    key: 'categories',
    label: 'Category IDs',
    description: 'Category term IDs assigned to the post, as a list of numbers.',
  },
  {
    key: 'tags',
    label: 'Tag IDs',
    description: 'Tag term IDs assigned to the post, as a list of numbers.',
  },
  { key: 'comment_status', label: 'Comment Status' },
  { key: 'ping_status', label: 'Ping Status' },
];

// update_post returns response.body, so its paths are bare — unlike the create/get
// actions above, which return the full HttpResponse and address the post under body.
export const updatePostActionOutputSchema: OutputSchema = { fields: postFields };

export const newPostTriggerOutputSchema: OutputSchema = { fields: postFields };
