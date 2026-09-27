import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const redactedFieldsField: OutputSchemaField = {
  key: 'redacted_fields',
  label: 'Redacted Fields',
  description:
    'Response paths Shopify withheld, for example because the app is not approved for protected customer data.',
};

const pagingFields: OutputSchema['fields'] = [
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'has_next_page', label: 'Has Next Page', format: 'boolean' },
  {
    key: 'end_cursor',
    label: 'End Cursor',
    description: 'Pass back as the cursor to read the next page.',
  },
  redactedFieldsField,
];

const blogFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Blog ID' },
  { key: 'title', label: 'Title' },
  { key: 'handle', label: 'Handle' },
  {
    key: 'comment_policy',
    label: 'Comment Policy',
    description: 'CLOSED, MODERATED or AUTO_PUBLISHED.',
  },
  { key: 'template_suffix', label: 'Template Suffix' },
  { key: 'articles_count', label: 'Articles Count', format: 'number' },
  { key: 'feed_path', label: 'Feed Path' },
  { key: 'feed_location', label: 'Feed Location', format: 'url' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const articleSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Article ID' },
  { key: 'title', label: 'Title' },
  { key: 'handle', label: 'Handle' },
  { key: 'author_name', label: 'Author Name' },
  { key: 'blog_id', label: 'Blog ID' },
  { key: 'blog_title', label: 'Blog Title' },
  { key: 'summary_html', label: 'Summary', format: 'html' },
  { key: 'tags', label: 'Tags', description: 'Comma-separated tags.' },
  { key: 'is_published', label: 'Is Published', format: 'boolean' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
  { key: 'template_suffix', label: 'Template Suffix' },
  { key: 'image_url', label: 'Image', format: 'image' },
  { key: 'image_alt_text', label: 'Image Alt Text' },
  { key: 'comments_count', label: 'Comments Count', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const commentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Comment ID' },
  {
    key: 'status',
    label: 'Status',
    description: 'PENDING, PUBLISHED, SPAM, REMOVED or UNAPPROVED.',
  },
  { key: 'body', label: 'Body' },
  { key: 'body_html', label: 'Body HTML', format: 'html' },
  { key: 'is_published', label: 'Is Published', format: 'boolean' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
  { key: 'author_name', label: 'Author Name' },
  { key: 'author_email', label: 'Author Email', format: 'email' },
  { key: 'ip', label: 'IP Address' },
  { key: 'user_agent', label: 'User Agent' },
  { key: 'article_id', label: 'Article ID' },
  { key: 'article_title', label: 'Article Title' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const pageSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Page ID' },
  { key: 'title', label: 'Title' },
  { key: 'handle', label: 'Handle' },
  { key: 'body_summary', label: 'Body Summary' },
  { key: 'is_published', label: 'Is Published', format: 'boolean' },
  { key: 'published_at', label: 'Published At', format: 'datetime' },
  { key: 'template_suffix', label: 'Template Suffix' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const urlRedirectFields: OutputSchema['fields'] = [
  { key: 'id', label: 'URL Redirect ID' },
  { key: 'path', label: 'Path' },
  { key: 'target', label: 'Target' },
];

const themeFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Theme ID' },
  { key: 'name', label: 'Name' },
  {
    key: 'role',
    label: 'Role',
    description: 'MAIN is the live theme; others are UNPUBLISHED, DEVELOPMENT and similar.',
  },
  { key: 'prefix', label: 'Preview Prefix' },
  { key: 'processing', label: 'Processing', format: 'boolean' },
  { key: 'processing_failed', label: 'Processing Failed', format: 'boolean' },
  { key: 'theme_store_id', label: 'Theme Store ID', format: 'number' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const themeReferenceFields: OutputSchema['fields'] = [
  { key: 'theme_id', label: 'Theme ID' },
  { key: 'theme_name', label: 'Theme Name' },
  { key: 'theme_role', label: 'Theme Role' },
];

const themeFileSummaryFields: OutputSchema['fields'] = [
  { key: 'filename', label: 'Filename' },
  { key: 'content_type', label: 'Content Type' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'checksum_md5', label: 'Checksum MD5' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const validationFields: OutputSchema['fields'] = [
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'value', label: 'Value' },
];

const metafieldDefinitionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Definition ID' },
  { key: 'name', label: 'Name' },
  { key: 'namespace', label: 'Namespace' },
  { key: 'key', label: 'Key' },
  { key: 'description', label: 'Description' },
  { key: 'owner_type', label: 'Owner Type' },
  { key: 'type', label: 'Type' },
  { key: 'type_category', label: 'Type Category' },
  { key: 'pinned_position', label: 'Pinned Position', format: 'number' },
  { key: 'validation_status', label: 'Validation Status' },
  {
    key: 'validations',
    label: 'Validations',
    labelKey: 'name',
    listItems: validationFields,
  },
  { key: 'metafields_count', label: 'Metafields Count', format: 'number' },
  { key: 'admin_access', label: 'Admin Access' },
  { key: 'storefront_access', label: 'Storefront Access' },
  { key: 'customer_account_access', label: 'Customer Account Access' },
  { key: 'admin_filterable', label: 'Admin Filterable', format: 'boolean' },
  {
    key: 'smart_collection_condition',
    label: 'Smart Collection Condition',
    format: 'boolean',
  },
  { key: 'unique_values', label: 'Unique Values', format: 'boolean' },
];

const metafieldFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Metafield ID' },
  { key: 'legacy_resource_id', label: 'Legacy Resource ID' },
  { key: 'namespace', label: 'Namespace' },
  { key: 'key', label: 'Key' },
  { key: 'type', label: 'Type' },
  {
    key: 'value',
    label: 'Value',
    description: 'Always a string; list and JSON types hold JSON text.',
  },
  {
    key: 'compare_digest',
    label: 'Compare Digest',
    description: 'Pass back to set_metafields to refuse the write if the value changed meanwhile.',
  },
  { key: 'owner_type', label: 'Owner Type' },
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'definition_id', label: 'Definition ID' },
  { key: 'definition_name', label: 'Definition Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const metafieldIdentifierFields: OutputSchema['fields'] = [
  { key: 'owner_id', label: 'Owner ID' },
  { key: 'namespace', label: 'Namespace' },
  { key: 'key', label: 'Key' },
];

const metaobjectDefinitionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Definition ID' },
  { key: 'type', label: 'Type' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'display_name_key', label: 'Display Name Key' },
  { key: 'metaobjects_count', label: 'Metaobjects Count', format: 'number' },
  { key: 'has_thumbnail_field', label: 'Has Thumbnail Field', format: 'boolean' },
  { key: 'publishable', label: 'Publishable', format: 'boolean' },
  { key: 'translatable', label: 'Translatable', format: 'boolean' },
  { key: 'renderable', label: 'Renderable', format: 'boolean' },
  { key: 'online_store', label: 'Online Store', format: 'boolean' },
  { key: 'admin_access', label: 'Admin Access' },
  { key: 'storefront_access', label: 'Storefront Access' },
  {
    key: 'field_definitions',
    label: 'Field Definitions',
    labelKey: 'name',
    listItems: [
      { key: 'key', label: 'Key' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'required', label: 'Required', format: 'boolean' },
      { key: 'type', label: 'Type' },
    ],
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const metaobjectFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Metaobject ID' },
  { key: 'type', label: 'Type' },
  { key: 'handle', label: 'Handle' },
  { key: 'display_name', label: 'Display Name' },
  {
    key: 'status',
    label: 'Status',
    description: 'ACTIVE or DRAFT for publishable types, otherwise empty.',
  },
  { key: 'template_suffix', label: 'Template Suffix' },
  { key: 'definition_id', label: 'Definition ID' },
  { key: 'definition_name', label: 'Definition Name' },
  {
    key: 'fields',
    label: 'Fields',
    labelKey: 'key',
    listItems: [
      { key: 'key', label: 'Key' },
      { key: 'type', label: 'Type' },
      { key: 'value', label: 'Value' },
    ],
  },
  {
    key: 'values',
    label: 'Values',
    dynamicKey: true,
    description: 'Field values keyed by field key.',
  },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const contentCountOutputSchema: OutputSchema = {
  fields: [
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'precision',
      label: 'Precision',
      description: 'EXACT, or AT_LEAST when Shopify capped the count.',
    },
    redactedFieldsField,
  ],
};

export const onlineStoreSettingsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'password_protection_enabled',
      label: 'Password Protection Enabled',
      format: 'boolean',
    },
    redactedFieldsField,
  ],
};

export const blogOutputSchema: OutputSchema = {
  fields: [...blogFields, redactedFieldsField],
};

export const getBlogOutputSchema: OutputSchema = {
  fields: [
    ...blogFields,
    { key: 'recent_article_tags', label: 'Recent Article Tags' },
    redactedFieldsField,
  ],
};

export const listBlogsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Blogs', labelKey: 'title', listItems: blogFields },
    ...pagingFields,
  ],
};

export const deleteBlogOutputSchema: OutputSchema = {
  fields: [{ key: 'deleted_blog_id', label: 'Deleted Blog ID' }, redactedFieldsField],
};

export const articleOutputSchema: OutputSchema = {
  fields: [
    ...articleSummaryFields,
    { key: 'body_html', label: 'Body HTML', format: 'html' },
    redactedFieldsField,
  ],
};

export const listArticlesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Articles',
      labelKey: 'title',
      listItems: articleSummaryFields,
    },
    ...pagingFields,
  ],
};

export const listArticleAuthorsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Authors',
      labelKey: 'name',
      listItems: [{ key: 'name', label: 'Name' }],
    },
    ...pagingFields,
  ],
};

export const listArticleTagsOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Tags' },
    { key: 'count', label: 'Count', format: 'number' },
    {
      key: 'truncated',
      label: 'Truncated',
      format: 'boolean',
      description: 'True when the store has more tags than the limit returned.',
    },
    redactedFieldsField,
  ],
};

export const deleteArticleOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_article_id', label: 'Deleted Article ID' },
    redactedFieldsField,
  ],
};

export const listCommentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Comments',
      labelKey: 'author_name',
      listItems: commentFields,
    },
    ...pagingFields,
  ],
};

export const pageOutputSchema: OutputSchema = {
  fields: [
    ...pageSummaryFields,
    { key: 'body_html', label: 'Body HTML', format: 'html' },
    redactedFieldsField,
  ],
};

export const listPagesOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Pages', labelKey: 'title', listItems: pageSummaryFields },
    ...pagingFields,
  ],
};

export const deletePageOutputSchema: OutputSchema = {
  fields: [{ key: 'deleted_page_id', label: 'Deleted Page ID' }, redactedFieldsField],
};

export const urlRedirectOutputSchema: OutputSchema = {
  fields: [...urlRedirectFields, redactedFieldsField],
};

export const listUrlRedirectsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'URL Redirects',
      labelKey: 'path',
      listItems: urlRedirectFields,
    },
    ...pagingFields,
  ],
};

export const deleteUrlRedirectOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_url_redirect_id', label: 'Deleted URL Redirect ID' },
    redactedFieldsField,
  ],
};

export const themeOutputSchema: OutputSchema = {
  fields: [...themeFields, redactedFieldsField],
};

export const listThemesOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Themes', labelKey: 'name', listItems: themeFields },
    ...pagingFields,
  ],
};

export const listThemeFilesOutputSchema: OutputSchema = {
  fields: [
    ...themeReferenceFields,
    {
      key: 'items',
      label: 'Files',
      labelKey: 'filename',
      listItems: themeFileSummaryFields,
    },
    ...pagingFields,
    {
      key: 'file_errors',
      label: 'File Errors',
      labelKey: 'filename',
      listItems: [
        { key: 'filename', label: 'Filename' },
        { key: 'code', label: 'Code' },
      ],
    },
  ],
};

export const getThemeFileOutputSchema: OutputSchema = {
  fields: [
    ...themeReferenceFields,
    ...themeFileSummaryFields,
    {
      key: 'body_type',
      label: 'Body Type',
      description: 'TEXT (content), BASE64 (content_base64) or URL (url).',
    },
    { key: 'content', label: 'Content' },
    { key: 'content_base64', label: 'Content (Base64)' },
    { key: 'url', label: 'URL', format: 'url' },
    redactedFieldsField,
  ],
};

export const listMetafieldDefinitionTypesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Types',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        {
          key: 'supports_definition_migrations',
          label: 'Supports Definition Migrations',
          format: 'boolean',
        },
        {
          key: 'supported_validations',
          label: 'Supported Validations',
          labelKey: 'name',
          listItems: [
            { key: 'name', label: 'Name' },
            { key: 'type', label: 'Type' },
          ],
        },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    redactedFieldsField,
  ],
};

export const listStandardMetafieldDefinitionTemplatesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Templates',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Template ID' },
        { key: 'namespace', label: 'Namespace' },
        { key: 'key', label: 'Key' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'owner_types', label: 'Owner Types' },
        { key: 'type', label: 'Type' },
        {
          key: 'visible_to_storefront_api',
          label: 'Visible To Storefront API',
          format: 'boolean',
        },
        {
          key: 'validations',
          label: 'Validations',
          labelKey: 'name',
          listItems: validationFields,
        },
      ],
    },
    ...pagingFields,
  ],
};

export const listMetafieldDefinitionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Metafield Definitions',
      labelKey: 'name',
      listItems: metafieldDefinitionFields,
    },
    ...pagingFields,
  ],
};

export const metafieldDefinitionOutputSchema: OutputSchema = {
  fields: [...metafieldDefinitionFields, redactedFieldsField],
};

export const updateMetafieldDefinitionOutputSchema: OutputSchema = {
  fields: [
    ...metafieldDefinitionFields,
    {
      key: 'validation_job_id',
      label: 'Validation Job ID',
      description: 'Background job that re-validates existing values; poll it with get_job.',
    },
    { key: 'validation_job_done', label: 'Validation Job Done', format: 'boolean' },
    redactedFieldsField,
  ],
};

export const pinMetafieldDefinitionOutputSchema: OutputSchema = {
  fields: [
    ...metafieldDefinitionFields,
    { key: 'already_pinned', label: 'Already Pinned', format: 'boolean' },
    redactedFieldsField,
  ],
};

export const setMetafieldsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'metafields',
      label: 'Metafields',
      labelKey: 'key',
      listItems: metafieldFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
    redactedFieldsField,
  ],
};

export const listMetafieldsOutputSchema: OutputSchema = {
  fields: [
    { key: 'owner_id', label: 'Owner ID' },
    {
      key: 'items',
      label: 'Metafields',
      labelKey: 'key',
      listItems: metafieldFields,
    },
    ...pagingFields,
  ],
};

export const metafieldOutputSchema: OutputSchema = {
  fields: [...metafieldFields, redactedFieldsField],
};

export const deleteMetafieldsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'deleted',
      label: 'Deleted',
      labelKey: 'key',
      listItems: metafieldIdentifierFields,
    },
    {
      key: 'not_found',
      label: 'Not Found',
      labelKey: 'key',
      listItems: metafieldIdentifierFields,
    },
    { key: 'deleted_count', label: 'Deleted Count', format: 'number' },
    redactedFieldsField,
  ],
};

export const listMetaobjectDefinitionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Metaobject Definitions',
      labelKey: 'name',
      listItems: metaobjectDefinitionFields,
    },
    ...pagingFields,
  ],
};

export const metaobjectDefinitionOutputSchema: OutputSchema = {
  fields: [...metaobjectDefinitionFields, redactedFieldsField],
};

export const metaobjectOutputSchema: OutputSchema = {
  fields: [...metaobjectFields, redactedFieldsField],
};

export const listMetaobjectsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Metaobjects',
      labelKey: 'display_name',
      listItems: metaobjectFields,
    },
    ...pagingFields,
  ],
};

export const deleteMetaobjectOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted_metaobject_id', label: 'Deleted Metaobject ID' },
    redactedFieldsField,
  ],
};

export const bulkDeleteMetaobjectsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'job_id',
      label: 'Job ID',
      description: 'Background deletion job; poll it with get_job.',
    },
    { key: 'done', label: 'Done', format: 'boolean' },
    { key: 'scope', label: 'Scope', description: 'BY_IDS or ALL_OF_TYPE.' },
    redactedFieldsField,
  ],
};

export const deleteMetaobjectDefinitionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'deleted_metaobject_definition_id',
      label: 'Deleted Metaobject Definition ID',
    },
    redactedFieldsField,
  ],
};
