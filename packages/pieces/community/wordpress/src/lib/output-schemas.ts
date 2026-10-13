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

const renderedRawTextFields: OutputSchema['fields'] = [
  { key: 'rendered', label: 'Rendered', format: 'html' },
  { key: 'raw', label: 'Raw' },
];

const renderedRawUrlFields: OutputSchema['fields'] = [
  { key: 'rendered', label: 'Rendered', format: 'url' },
  { key: 'raw', label: 'Raw', format: 'url' },
];

const renderedRawBodyFields: OutputSchema['fields'] = [
  { key: 'rendered', label: 'Rendered', format: 'html' },
  { key: 'raw', label: 'Raw' },
  { key: 'protected', label: 'Password Protected', format: 'boolean' },
];

const renderedRawContentFields: OutputSchema['fields'] = [
  ...renderedRawBodyFields,
  { key: 'block_version', label: 'Block Version', format: 'number' },
];

const itemDateFields: OutputSchema['fields'] = [
  { key: 'date', label: 'Published Date', format: 'datetime' },
  { key: 'date_gmt', label: 'Published Date (GMT)', format: 'datetime' },
  { key: 'modified', label: 'Modified Date', format: 'datetime' },
  { key: 'modified_gmt', label: 'Modified Date (GMT)', format: 'datetime' },
];

const itemCommonFields: OutputSchema['fields'] = [
  ...itemDateFields,
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'slug', label: 'Slug' },
  { key: 'status', label: 'Status' },
  { key: 'type', label: 'Type' },
  { key: 'author', label: 'Author ID', format: 'number' },
  { key: 'featured_media', label: 'Featured Media ID', format: 'number' },
  { key: 'comment_status', label: 'Comment Status' },
  { key: 'ping_status', label: 'Ping Status' },
  { key: 'template', label: 'Template' },
  { key: 'meta', label: 'Meta', description: 'Registered meta fields; the keys depend on the site.' },
  { key: 'class_list', label: 'CSS Classes', description: 'CSS classes WordPress assigns to the item, as a list of strings.' },
];

const editOnlyFields: OutputSchema['fields'] = [
  { key: 'permalink_template', label: 'Permalink Template' },
  { key: 'generated_slug', label: 'Generated Slug' },
];

const postTermFields: OutputSchema['fields'] = [
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
];

const postViewFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Post ID', format: 'number' },
  { key: 'title', label: 'Title', children: renderedTextFields },
  { key: 'content', label: 'Content', children: renderedBodyFields },
  { key: 'excerpt', label: 'Excerpt', children: renderedBodyFields },
  { key: 'guid', label: 'GUID', children: renderedUrlFields },
  ...itemCommonFields,
  ...postTermFields,
];

const postEditFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Post ID', format: 'number' },
  { key: 'title', label: 'Title', children: renderedRawTextFields },
  { key: 'content', label: 'Content', children: renderedRawContentFields },
  { key: 'excerpt', label: 'Excerpt', children: renderedRawBodyFields },
  { key: 'guid', label: 'GUID', children: renderedRawUrlFields },
  { key: 'password', label: 'Post Password' },
  ...itemCommonFields,
  ...postTermFields,
  ...editOnlyFields,
];

const pageOnlyFields: OutputSchema['fields'] = [
  { key: 'parent', label: 'Parent Page ID', format: 'number' },
  { key: 'menu_order', label: 'Menu Order', format: 'number' },
];

const pageViewFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Page ID', format: 'number' },
  { key: 'title', label: 'Title', children: renderedTextFields },
  { key: 'content', label: 'Content', children: renderedBodyFields },
  { key: 'excerpt', label: 'Excerpt', description: 'Present only when the theme or site supports page excerpts.', children: renderedBodyFields },
  { key: 'guid', label: 'GUID', children: renderedUrlFields },
  ...itemCommonFields,
  ...pageOnlyFields,
];

const pageEditFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Page ID', format: 'number' },
  { key: 'title', label: 'Title', children: renderedRawTextFields },
  { key: 'content', label: 'Content', children: renderedRawContentFields },
  { key: 'excerpt', label: 'Excerpt', description: 'Present only when the theme or site supports page excerpts.', children: renderedRawBodyFields },
  { key: 'guid', label: 'GUID', children: renderedRawUrlFields },
  { key: 'password', label: 'Page Password' },
  ...itemCommonFields,
  ...pageOnlyFields,
  ...editOnlyFields,
];

const termFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Term ID', format: 'number' },
  { key: 'name', label: 'Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'description', label: 'Description' },
  { key: 'count', label: 'Published Post Count', format: 'number' },
  { key: 'link', label: 'Archive Link', format: 'url' },
  { key: 'taxonomy', label: 'Taxonomy' },
  { key: 'meta', label: 'Meta', description: 'Registered term meta; usually an empty list.' },
];

const categoryFields: OutputSchema['fields'] = [
  ...termFields,
  { key: 'parent', label: 'Parent Category ID', format: 'number', description: '0 when the category has no parent.' },
];

const avatarFields: OutputSchema['fields'] = [
  { key: '24', label: 'Avatar 24px', format: 'image' },
  { key: '48', label: 'Avatar 48px', format: 'image' },
  { key: '96', label: 'Avatar 96px', format: 'image' },
];

const commentViewFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID', format: 'number' },
  { key: 'post', label: 'Post ID', format: 'number' },
  { key: 'parent', label: 'Parent Comment ID', format: 'number' },
  { key: 'author', label: 'Author User ID', format: 'number', description: '0 for a guest comment.' },
  { key: 'author_name', label: 'Author Name' },
  { key: 'author_url', label: 'Author URL', format: 'url' },
  { key: 'date', label: 'Date', format: 'datetime' },
  { key: 'date_gmt', label: 'Date (GMT)', format: 'datetime' },
  { key: 'content', label: 'Content', children: renderedTextFields },
  { key: 'link', label: 'Link', format: 'url' },
  { key: 'status', label: 'Status', description: 'approved, hold, spam or trash.' },
  { key: 'type', label: 'Type' },
  { key: 'author_avatar_urls', label: 'Author Avatars', children: avatarFields },
  { key: 'meta', label: 'Meta', description: 'Registered comment meta; the keys depend on the site.' },
];

const commentEditFields: OutputSchema['fields'] = [
  ...commentViewFields.filter((field) => field.key !== 'content'),
  { key: 'content', label: 'Content', children: renderedRawTextFields },
  { key: 'author_email', label: 'Author Email', format: 'email' },
  { key: 'author_ip', label: 'Author IP' },
  { key: 'author_user_agent', label: 'Author User Agent' },
];

const mediaViewFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Media ID', format: 'number' },
  { key: 'title', label: 'Title', children: renderedTextFields },
  { key: 'guid', label: 'GUID', children: renderedUrlFields },
  { key: 'description', label: 'Description', children: renderedTextFields },
  { key: 'caption', label: 'Caption', children: renderedTextFields },
  ...itemCommonFields,
  { key: 'alt_text', label: 'Alt Text' },
  { key: 'media_type', label: 'Media Type' },
  { key: 'mime_type', label: 'MIME Type' },
  { key: 'source_url', label: 'File URL', format: 'url' },
  { key: 'filename', label: 'File Name' },
  { key: 'filesize', label: 'File Size', format: 'filesize' },
  { key: 'post', label: 'Attached Post ID', format: 'number', description: 'null when the file is not attached to a post.' },
  {
    key: 'media_details',
    label: 'Media Details',
    description: 'File details; images also carry sizes and image_meta.',
    children: [
      { key: 'width', label: 'Width', format: 'number' },
      { key: 'height', label: 'Height', format: 'number' },
      { key: 'file', label: 'Relative File Path' },
      { key: 'filesize', label: 'File Size', format: 'filesize' },
      { key: 'sizes', label: 'Sizes', dynamicKey: true, description: 'Generated image sizes keyed by size name.' },
      { key: 'image_meta', label: 'Image Metadata', description: 'EXIF-style metadata extracted from the image.' },
    ],
  },
];

const mediaEditFields: OutputSchema['fields'] = [
  ...mediaViewFields.filter(
    (field) => !['title', 'guid', 'description', 'caption'].includes(field.key)
  ),
  { key: 'title', label: 'Title', children: renderedRawTextFields },
  { key: 'guid', label: 'GUID', children: renderedRawUrlFields },
  { key: 'description', label: 'Description', children: renderedRawTextFields },
  { key: 'caption', label: 'Caption', children: renderedRawTextFields },
  ...editOnlyFields,
  { key: 'missing_image_sizes', label: 'Missing Image Sizes', description: 'Image sizes WordPress has not generated yet.' },
  { key: 'exif_orientation', label: 'EXIF Orientation', format: 'number' },
  { key: 'image_output_format', label: 'Image Output Format' },
  { key: 'image_save_progressive', label: 'Save Progressive', format: 'boolean' },
  { key: 'image_quality', label: 'Image Quality', description: 'Default quality and per-size quality.' },
];

const userPublicFields: OutputSchema['fields'] = [
  { key: 'id', label: 'User ID', format: 'number' },
  { key: 'name', label: 'Display Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'url', label: 'Website', format: 'url' },
  { key: 'description', label: 'Biography' },
  { key: 'link', label: 'Author Archive Link', format: 'url' },
  { key: 'avatar_urls', label: 'Avatars', children: avatarFields },
  { key: 'meta', label: 'Meta', description: 'Registered user meta; the keys depend on the site.' },
  { key: 'is_super_admin', label: 'Is Super Admin', format: 'boolean' },
];

const currentUserFields: OutputSchema['fields'] = [
  ...userPublicFields,
  { key: 'username', label: 'Username' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'nickname', label: 'Nickname' },
  { key: 'locale', label: 'Locale' },
  { key: 'registered_date', label: 'Registered Date', format: 'datetime' },
  { key: 'roles', label: 'Roles', description: 'Role slugs, e.g. administrator, editor, author.' },
  { key: 'capabilities', label: 'Capabilities', dynamicKey: true, description: 'Capability name to true/false for this user.' },
  { key: 'extra_capabilities', label: 'Extra Capabilities', dynamicKey: true },
];

const searchResultFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID', format: 'number' },
  { key: 'title', label: 'Title' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'type', label: 'Type', description: 'post for posts and pages; the taxonomy (category, post_tag) for terms.' },
  { key: 'subtype', label: 'Subtype', description: 'post or page; present for post results only.' },
];

const settingsFields: OutputSchema['fields'] = [
  { key: 'title', label: 'Site Title' },
  { key: 'description', label: 'Tagline' },
  { key: 'url', label: 'Site URL', format: 'url' },
  { key: 'email', label: 'Admin Email', format: 'email' },
  { key: 'timezone', label: 'Timezone', description: 'Empty when the site uses a UTC offset instead of a named zone.' },
  { key: 'date_format', label: 'Date Format' },
  { key: 'time_format', label: 'Time Format' },
  { key: 'start_of_week', label: 'Start of Week', format: 'number' },
  { key: 'language', label: 'Language' },
  { key: 'use_smilies', label: 'Convert Emoticons', format: 'boolean' },
  { key: 'default_category', label: 'Default Category ID', format: 'number' },
  { key: 'default_post_format', label: 'Default Post Format' },
  { key: 'posts_per_page', label: 'Posts Per Page', format: 'number' },
  { key: 'show_on_front', label: 'Front Page Shows' },
  { key: 'page_on_front', label: 'Front Page ID', format: 'number' },
  { key: 'page_for_posts', label: 'Posts Page ID', format: 'number' },
  { key: 'default_ping_status', label: 'Default Ping Status' },
  { key: 'default_comment_status', label: 'Default Comment Status' },
  { key: 'site_logo', label: 'Site Logo Media ID', format: 'number', description: 'null when no logo is set.' },
  { key: 'site_icon', label: 'Site Icon Media ID', format: 'number' },
];

function listSchema({
  key,
  label,
  itemFields,
  itemLabel,
}: {
  key: string;
  label: string;
  itemFields: OutputSchema['fields'];
  itemLabel: string;
}): OutputSchema {
  return {
    fields: [
      { key, label, labelKey: itemLabel, listItems: itemFields },
      { key: 'count', label: 'Returned Count', format: 'number' },
      { key: 'total', label: 'Total Matches', format: 'number', description: 'From the X-WP-Total header; absent when the host strips it.' },
      { key: 'total_pages', label: 'Total Pages', format: 'number', description: 'From the X-WP-TotalPages header; absent when the host strips it.' },
    ],
  };
}

function deleteSchema({ itemFields }: { itemFields: OutputSchema['fields'] }): OutputSchema {
  return {
    fields: [
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'previous', label: 'Deleted Item', children: itemFields },
    ],
  };
}

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

export const updatePostActionOutputSchema: OutputSchema = { fields: postFields };

export const newPostTriggerOutputSchema: OutputSchema = { fields: postFields };

export const listPostsOutputSchema: OutputSchema = listSchema({ key: 'posts', label: 'Posts', itemFields: postViewFields, itemLabel: 'slug' });

export const getPostByIdOutputSchema: OutputSchema = { fields: postViewFields };

export const postEditOutputSchema: OutputSchema = { fields: postEditFields };

export const deletePostOutputSchema: OutputSchema = deleteSchema({ itemFields: postEditFields });

export const listPagesOutputSchema: OutputSchema = listSchema({ key: 'pages', label: 'Pages', itemFields: pageViewFields, itemLabel: 'slug' });

export const getPageOutputSchema: OutputSchema = { fields: pageViewFields };

export const pageEditOutputSchema: OutputSchema = { fields: pageEditFields };

export const listCategoriesOutputSchema: OutputSchema = listSchema({ key: 'categories', label: 'Categories', itemFields: categoryFields, itemLabel: 'name' });

export const createCategoryOutputSchema: OutputSchema = {
  fields: [
    ...categoryFields,
    { key: 'created', label: 'Created', format: 'boolean', description: 'false when a category with this name already existed under the same parent and was returned instead.' },
  ],
};

export const deleteCategoryOutputSchema: OutputSchema = deleteSchema({ itemFields: categoryFields });

export const listTagsOutputSchema: OutputSchema = listSchema({ key: 'tags', label: 'Tags', itemFields: termFields, itemLabel: 'name' });

export const createTagOutputSchema: OutputSchema = {
  fields: [
    ...termFields,
    { key: 'created', label: 'Created', format: 'boolean', description: 'false when a tag with this name already existed and was returned instead.' },
  ],
};

export const deleteTagOutputSchema: OutputSchema = deleteSchema({ itemFields: termFields });

export const listCommentsOutputSchema: OutputSchema = listSchema({ key: 'comments', label: 'Comments', itemFields: commentViewFields, itemLabel: 'author_name' });

export const commentEditOutputSchema: OutputSchema = { fields: commentEditFields };

export const deleteCommentOutputSchema: OutputSchema = deleteSchema({ itemFields: commentEditFields });

export const listMediaOutputSchema: OutputSchema = listSchema({ key: 'media', label: 'Media', itemFields: mediaViewFields, itemLabel: 'filename' });

export const getMediaOutputSchema: OutputSchema = { fields: mediaViewFields };

export const mediaEditOutputSchema: OutputSchema = { fields: mediaEditFields };

export const deleteMediaOutputSchema: OutputSchema = deleteSchema({ itemFields: mediaEditFields });

export const getCurrentUserOutputSchema: OutputSchema = { fields: currentUserFields };

export const listUsersOutputSchema: OutputSchema = listSchema({ key: 'users', label: 'Users', itemFields: userPublicFields, itemLabel: 'name' });

export const searchSiteContentOutputSchema: OutputSchema = listSchema({ key: 'results', label: 'Results', itemFields: searchResultFields, itemLabel: 'title' });

export const getSiteSettingsOutputSchema: OutputSchema = { fields: settingsFields };
