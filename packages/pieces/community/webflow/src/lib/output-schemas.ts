import { OutputSchema } from '@activepieces/pieces-framework';

const paginationField: OutputSchema['fields'][number] = {
  key: 'pagination',
  label: 'Pagination',
  children: [
    { key: 'limit', label: 'Page Size', format: 'number' },
    { key: 'offset', label: 'Offset', format: 'number' },
    { key: 'total', label: 'Total Count', format: 'number' },
  ],
};

const moneyFields: OutputSchema['fields'] = [
  { key: 'value', label: 'Amount', format: 'number' },
  { key: 'unit', label: 'Currency' },
  { key: 'string', label: 'Formatted Amount' },
];

const collectionItemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Item ID' },
  { key: 'cmsLocaleId', label: 'Locale ID' },
  { key: 'lastPublished', label: 'Last Published', format: 'datetime' },
  { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
  { key: 'createdOn', label: 'Created On', format: 'datetime' },
  { key: 'isArchived', label: 'Archived', format: 'boolean' },
  { key: 'isDraft', label: 'Draft', format: 'boolean' },
  { key: 'fieldData', label: 'Field Data', dynamicKey: true },
];

const collectionFieldBaseFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Field ID' },
  { key: 'isEditable', label: 'Editable', format: 'boolean' },
  { key: 'isRequired', label: 'Required', format: 'boolean' },
  { key: 'type', label: 'Field Type' },
  { key: 'slug', label: 'Slug' },
  { key: 'displayName', label: 'Name' },
  { key: 'helpText', label: 'Help Text' },
];

const textValidationFields: OutputSchema['fields'] = [
  { key: 'maxLength', label: 'Maximum Length', format: 'number' },
  { key: 'pattern', label: 'Pattern' },
  {
    key: 'messages',
    label: 'Validation Messages',
    children: [
      { key: 'pattern', label: 'Pattern Message' },
      { key: 'maxLength', label: 'Maximum Length Message' },
    ],
  },
];

const collectionFieldFields: OutputSchema['fields'] = [
  ...collectionFieldBaseFields,
  {
    key: 'validations',
    label: 'Validations',
    children: [
      ...textValidationFields,
      { key: 'format', label: 'Format' },
      { key: 'allowNegative', label: 'Allow Negative', format: 'boolean' },
      { key: 'precision', label: 'Precision', format: 'number' },
      {
        key: 'options',
        label: 'Options',
        labelKey: 'name',
        listItems: [
          { key: 'name', label: 'Name' },
          { key: 'id', label: 'Option ID' },
        ],
      },
    ],
  },
];

const collectionFieldUpdateFields: OutputSchema['fields'] = [
  ...collectionFieldBaseFields,
  { key: 'validations', label: 'Validations', children: textValidationFields },
];

const collectionSummaryFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Collection ID' },
  { key: 'displayName', label: 'Name' },
  { key: 'singularName', label: 'Singular Name' },
  { key: 'slug', label: 'Slug' },
  { key: 'createdOn', label: 'Created On', format: 'datetime' },
  { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
];

const collectionFields: OutputSchema['fields'] = [
  ...collectionSummaryFields,
  {
    key: 'fields',
    label: 'Fields',
    labelKey: 'displayName',
    listItems: collectionFieldFields,
  },
  { key: 'fieldGroups', label: 'Field Groups' },
];

const collectionUpdateFields: OutputSchema['fields'] = [
  ...collectionSummaryFields,
  {
    key: 'fields',
    label: 'Fields',
    labelKey: 'displayName',
    listItems: collectionFieldUpdateFields,
  },
  { key: 'fieldGroups', label: 'Field Groups' },
];

const assetFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Asset ID' },
  { key: 'originalFileName', label: 'Original File Name' },
  { key: 'displayName', label: 'Name' },
  { key: 'contentType', label: 'Content Type' },
  { key: 'size', label: 'File Size', format: 'filesize' },
  { key: 'siteId', label: 'Site ID' },
  { key: 'createdOn', label: 'Created On', format: 'datetime' },
  { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
  { key: 'hostedUrl', label: 'Hosted URL', format: 'image' },
  { key: 'variants', label: 'Variants' },
  { key: 'altText', label: 'Alt Text' },
];

const assetFolderFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Folder ID' },
  { key: 'displayName', label: 'Name' },
  { key: 'parentFolder', label: 'Parent Folder ID' },
  { key: 'assets', label: 'Asset IDs' },
  { key: 'siteId', label: 'Site ID' },
  { key: 'createdOn', label: 'Created On', format: 'datetime' },
  { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
];

const customFontFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Font ID' },
  { key: 'fontFamily', label: 'Font Family' },
  { key: 'weight', label: 'Weight', format: 'number' },
  { key: 'italic', label: 'Italic', format: 'boolean' },
  { key: 'fontDisplay', label: 'Font Display' },
  { key: 'format', label: 'File Format' },
  { key: 'fileName', label: 'File Name' },
  { key: 'hostedUrl', label: 'Hosted URL', format: 'url' },
  { key: 'axes', label: 'Variable Axes' },
  { key: 'fileHash', label: 'File Hash' },
  { key: 'uploadedOn', label: 'Uploaded On', format: 'datetime' },
];

const commentAuthorField: OutputSchema['fields'][number] = {
  key: 'author',
  label: 'Author',
  children: [
    { key: 'userId', label: 'User ID' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'verified', label: 'Verified', format: 'boolean' },
  ],
};

const commentBodyFields: OutputSchema['fields'] = [
  { key: 'siteId', label: 'Site ID' },
  { key: 'pageId', label: 'Page ID' },
  { key: 'localeId', label: 'Locale ID' },
  { key: 'elementId', label: 'Element ID' },
  { key: 'objectId', label: 'Object ID' },
  { key: 'objectType', label: 'Object Type' },
  { key: 'itemId', label: 'Item ID' },
  { key: 'breakpoint', label: 'Breakpoint' },
  { key: 'url', label: 'Comment URL', format: 'url' },
  { key: 'content', label: 'Content' },
  { key: 'isResolved', label: 'Resolved', format: 'boolean' },
  commentAuthorField,
  { key: 'mentionedUsers', label: 'Mentioned Users' },
  { key: 'createdOn', label: 'Created On', format: 'datetime' },
  { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
];

const commentThreadFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Thread ID' },
  ...commentBodyFields,
];

const commentReplyFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Reply ID' },
  { key: 'commentId', label: 'Thread ID' },
  ...commentBodyFields,
];

const pageFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Page ID' },
  { key: 'siteId', label: 'Site ID' },
  { key: 'parentId', label: 'Parent Page ID' },
  { key: 'collectionId', label: 'Collection ID' },
  { key: 'title', label: 'Title' },
  { key: 'slug', label: 'Slug' },
  { key: 'createdOn', label: 'Created On', format: 'datetime' },
  { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
  { key: 'archived', label: 'Archived', format: 'boolean' },
  { key: 'draft', label: 'Draft', format: 'boolean' },
  { key: 'shouldPublish', label: 'Should Publish', format: 'boolean' },
  { key: 'canBranch', label: 'Can Branch', format: 'boolean' },
  { key: 'isBranch', label: 'Is Branch', format: 'boolean' },
  { key: 'branchId', label: 'Branch ID' },
  {
    key: 'seo',
    label: 'SEO',
    children: [
      { key: 'title', label: 'SEO Title' },
      { key: 'description', label: 'SEO Description' },
    ],
  },
  {
    key: 'openGraph',
    label: 'Open Graph',
    children: [
      { key: 'title', label: 'Title' },
      { key: 'titleCopied', label: 'Title Copied From SEO', format: 'boolean' },
      { key: 'description', label: 'Description' },
      {
        key: 'descriptionCopied',
        label: 'Description Copied From SEO',
        format: 'boolean',
      },
      { key: 'imageUrl', label: 'Image URL', format: 'image' },
      { key: 'imageAssetId', label: 'Image Asset ID' },
    ],
  },
  { key: 'publishedPath', label: 'Published Path' },
  { key: 'localeId', label: 'Locale ID' },
];

const siteFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Site ID' },
  { key: 'workspaceId', label: 'Workspace ID' },
  { key: 'displayName', label: 'Name' },
  { key: 'shortName', label: 'Short Name' },
  { key: 'previewUrl', label: 'Preview Image', format: 'image' },
  { key: 'timeZone', label: 'Time Zone' },
  { key: 'createdOn', label: 'Created On', format: 'datetime' },
  { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
  { key: 'lastPublished', label: 'Last Published', format: 'datetime' },
  { key: 'fullSiteCompiledAt', label: 'Last Full Compile', format: 'datetime' },
  { key: 'parentFolderId', label: 'Parent Folder ID' },
  { key: 'customDomains', label: 'Custom Domains' },
  {
    key: 'locales',
    label: 'Locales',
    children: [
      {
        key: 'primary',
        label: 'Primary Locale',
        children: [
          { key: 'id', label: 'Locale ID' },
          { key: 'cmsLocaleId', label: 'CMS Locale ID' },
          { key: 'enabled', label: 'Enabled', format: 'boolean' },
          { key: 'displayName', label: 'Name' },
          { key: 'displayImageId', label: 'Display Image ID' },
          { key: 'redirect', label: 'Redirect', format: 'boolean' },
          { key: 'subdirectory', label: 'Subdirectory' },
          { key: 'tag', label: 'Language Tag' },
        ],
      },
      { key: 'secondary', label: 'Secondary Locales' },
    ],
  },
  {
    key: 'dataCollectionEnabled',
    label: 'Data Collection Enabled',
    format: 'boolean',
  },
  { key: 'dataCollectionType', label: 'Data Collection Type' },
];

const formFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Form ID' },
  { key: 'displayName', label: 'Name' },
  { key: 'createdOn', label: 'Created On', format: 'datetime' },
  { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
  {
    key: 'fields',
    label: 'Form Fields',
    dynamicKey: true,
    labelKey: 'displayName',
    children: [
      { key: 'displayName', label: 'Name' },
      { key: 'type', label: 'Field Type' },
      { key: 'placeholder', label: 'Placeholder' },
      { key: 'userVisible', label: 'Visible To User', format: 'boolean' },
      { key: 'fieldElementId', label: 'Field Element ID' },
    ],
  },
  {
    key: 'responseSettings',
    label: 'Response Settings',
    children: [
      { key: 'redirectUrl', label: 'Redirect URL', format: 'url' },
      { key: 'redirectMethod', label: 'Redirect Method' },
      { key: 'redirectAction', label: 'Redirect Action' },
      {
        key: 'sendEmailConfirmation',
        label: 'Send Email Confirmation',
        format: 'boolean',
      },
    ],
  },
  { key: 'siteId', label: 'Site ID' },
  { key: 'siteDomainId', label: 'Site Domain ID' },
  { key: 'pageId', label: 'Page ID' },
  { key: 'formElementId', label: 'Form Element ID' },
  { key: 'pageName', label: 'Page Name' },
  { key: 'workspaceId', label: 'Workspace ID' },
  { key: 'componentId', label: 'Component ID' },
  { key: 'componentElementId', label: 'Component Element ID' },
];

const submissionSchemaField: OutputSchema['fields'][number] = {
  key: 'schema',
  label: 'Field Schema',
  labelKey: 'fieldName',
  listItems: [
    { key: 'fieldName', label: 'Field Name' },
    { key: 'fieldType', label: 'Field Type' },
    { key: 'fieldElementId', label: 'Field Element ID' },
  ],
};

const formSubmissionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Submission ID' },
  { key: 'formId', label: 'Form ID' },
  { key: 'displayName', label: 'Form Name' },
  { key: 'siteId', label: 'Site ID' },
  { key: 'workspaceId', label: 'Workspace ID' },
  { key: 'formResponse', label: 'Form Response', dynamicKey: true },
  { key: 'dateSubmitted', label: 'Submitted At', format: 'datetime' },
  { key: 'pageId', label: 'Page ID' },
  { key: 'publishedPath', label: 'Published Path' },
  { key: 'localeId', label: 'Locale ID' },
];

const formSubmissionElementFields: OutputSchema['fields'] = [
  { key: 'formElementId', label: 'Form Element ID' },
  { key: 'componentElementId', label: 'Component Element ID' },
];

const googleTagFields: OutputSchema['fields'] = [
  { key: 'tagId', label: 'Tag ID' },
  { key: 'displayName', label: 'Name' },
  { key: 'order', label: 'Order', format: 'number' },
];

const customCodeScriptFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Script ID' },
  { key: 'displayName', label: 'Name' },
  { key: 'version', label: 'Version' },
  { key: 'location', label: 'Location' },
  { key: 'attributes', label: 'Attributes' },
];

const deletedFields: OutputSchema['fields'] = [
  { key: 'success', label: 'Success', format: 'boolean' },
];

export const createCollectionItemOutputSchema: OutputSchema = {
  fields: collectionItemFields,
};

export const findCollectionItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Found', format: 'boolean' },
    {
      key: 'result',
      label: 'Matching Items',
      labelKey: 'id',
      listItems: collectionItemFields,
    },
  ],
};

export const getCollectionItemOutputSchema: OutputSchema = {
  fields: collectionItemFields,
};

export const listCollectionsOutputSchema: OutputSchema = {
  itemLabel: '{displayName}',
  fields: [
    {
      key: 'collections',
      label: 'Collections',
      value: '',
      listItems: collectionSummaryFields,
    },
  ],
};

export const listSitesOutputSchema: OutputSchema = {
  itemLabel: '{displayName}',
  fields: [{ key: 'sites', label: 'Sites', value: '', listItems: siteFields }],
};

export const newSubmissionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Submission ID' },
    { key: 'name', label: 'Form Name' },
    { key: 'siteId', label: 'Site ID' },
    { key: 'data', label: 'Submitted Data', dynamicKey: true },
    { key: 'submittedAt', label: 'Submitted At', format: 'datetime' },
    { key: 'formId', label: 'Form ID' },
    { key: 'formElementId', label: 'Form Element ID' },
    { key: 'pageId', label: 'Page ID' },
    { key: 'publishedPath', label: 'Published Path' },
    { key: 'pageUrl', label: 'Page URL', format: 'url' },
    submissionSchemaField,
    { key: 'localeId', label: 'Locale ID' },
  ],
};

export const publishCollectionItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'publishedItemIds', label: 'Published Item IDs' },
    { key: 'errors', label: 'Errors' },
  ],
};

export const webflowCreateAssetFolderOutputSchema: OutputSchema = {
  fields: assetFolderFields,
};

export const webflowCreateCollectionOutputSchema: OutputSchema = {
  fields: collectionFields,
};

export const webflowCreateCollectionFieldOutputSchema: OutputSchema = {
  fields: [
    ...collectionFieldBaseFields,
    { key: 'validations', label: 'Validations' },
  ],
};

export const webflowCreateCollectionItemOutputSchema: OutputSchema = {
  fields: collectionItemFields,
};

export const webflowCreateCommentReplyOutputSchema: OutputSchema = {
  fields: commentReplyFields,
};

export const webflowCreateCustomFontOutputSchema: OutputSchema = {
  fields: [
    { key: 'customFont', label: 'Custom Font', children: customFontFields },
  ],
};

export const webflowCreateCustomFontsBatchOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'created',
      label: 'Created Fonts',
      labelKey: 'fontFamily',
      listItems: customFontFields,
    },
    { key: 'failed', label: 'Failed' },
  ],
};

export const webflowCreateLiveCollectionItemOutputSchema: OutputSchema = {
  fields: collectionItemFields,
};

export const webflowDeleteAssetOutputSchema: OutputSchema = {
  fields: [...deletedFields, { key: 'assetId', label: 'Asset ID' }],
};

export const webflowDeleteCustomFontsBatchOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'deleted',
      label: 'Deleted Fonts',
      labelKey: 'id',
      listItems: [{ key: 'id', label: 'Font ID' }],
    },
    { key: 'failed', label: 'Failed' },
  ],
};

export const webflowDeleteFormSubmissionOutputSchema: OutputSchema = {
  fields: [
    ...deletedFields,
    { key: 'formSubmissionId', label: 'Submission ID' },
  ],
};

export const webflowGetAssetOutputSchema: OutputSchema = {
  fields: assetFields,
};

export const webflowGetAuthorizedUserOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'User ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
  ],
};

export const webflowGetCommentThreadOutputSchema: OutputSchema = {
  fields: commentThreadFields,
};

export const webflowGetComponentContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'componentId', label: 'Component ID' },
    { key: 'nodes', label: 'Nodes' },
    paginationField,
  ],
};

export const webflowGetComponentPropertiesOutputSchema: OutputSchema = {
  fields: [
    { key: 'componentId', label: 'Component ID' },
    {
      key: 'properties',
      label: 'Properties',
      labelKey: 'label',
      listItems: [
        { key: 'propertyId', label: 'Property ID' },
        { key: 'type', label: 'Property Type' },
        { key: 'label', label: 'Label' },
        {
          key: 'text',
          label: 'Text',
          children: [
            { key: 'html', label: 'HTML', format: 'html' },
            { key: 'text', label: 'Plain Text' },
          ],
        },
      ],
    },
    paginationField,
  ],
};

export const webflowGetFormOutputSchema: OutputSchema = { fields: formFields };

export const webflowGetFormSubmissionOutputSchema: OutputSchema = {
  fields: [
    ...formSubmissionFields,
    submissionSchemaField,
    ...formSubmissionElementFields,
  ],
};

export const webflowGetPageOutputSchema: OutputSchema = { fields: pageFields };

export const webflowGetPageContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'pageId', label: 'Page ID' },
    { key: 'branchId', label: 'Branch ID' },
    { key: 'nodes', label: 'Nodes' },
    paginationField,
    { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
  ],
};

export const webflowGetPageCustomCodeOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'scripts',
      label: 'Scripts',
      labelKey: 'displayName',
      listItems: customCodeScriptFields,
    },
    { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
    { key: 'createdOn', label: 'Created On', format: 'datetime' },
  ],
};

export const webflowGetSiteOutputSchema: OutputSchema = {
  fields: [...siteFields, { key: 'googleTagIds', label: 'Google Tag IDs' }],
};

export const webflowGetTokenInfoOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'authorization',
      label: 'Authorization',
      children: [
        { key: 'id', label: 'Authorization ID' },
        { key: 'createdOn', label: 'Created On', format: 'datetime' },
        { key: 'lastUsed', label: 'Last Used', format: 'datetime' },
        { key: 'grantType', label: 'Grant Type' },
        { key: 'rateLimit', label: 'Rate Limit Per Minute', format: 'number' },
        { key: 'scope', label: 'Scopes' },
        {
          key: 'authorizedTo',
          label: 'Authorized To',
          children: [
            { key: 'siteIds', label: 'Site IDs' },
            { key: 'workspaceIds', label: 'Workspace IDs' },
            { key: 'userIds', label: 'User IDs' },
          ],
        },
      ],
    },
    {
      key: 'application',
      label: 'Application',
      children: [
        { key: 'id', label: 'Application ID' },
        { key: 'description', label: 'Description' },
        { key: 'homepage', label: 'Homepage', format: 'url' },
        { key: 'displayName', label: 'Name' },
      ],
    },
  ],
};

export const webflowListAssetFoldersOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'assetFolders',
      label: 'Asset Folders',
      labelKey: 'displayName',
      listItems: assetFolderFields,
    },
    paginationField,
  ],
};

export const webflowListAssetsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'assets',
      label: 'Assets',
      labelKey: 'displayName',
      listItems: [...assetFields, { key: 'folderId', label: 'Folder ID' }],
    },
    paginationField,
  ],
};

export const webflowListCollectionItemsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'id',
      listItems: collectionItemFields,
    },
    paginationField,
  ],
};

export const webflowListCollectionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'collections',
      label: 'Collections',
      labelKey: 'displayName',
      listItems: collectionSummaryFields,
    },
  ],
};

export const webflowListCommentRepliesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comments',
      label: 'Replies',
      labelKey: 'id',
      listItems: commentReplyFields,
    },
    paginationField,
  ],
};

export const webflowListCommentThreadsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'comments',
      label: 'Comment Threads',
      labelKey: 'id',
      listItems: commentThreadFields,
    },
    paginationField,
  ],
};

export const webflowListComponentsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'components',
      label: 'Components',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Component ID' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'group', label: 'Group' },
      ],
    },
    paginationField,
  ],
};

export const webflowListCustomCodeBlocksOutputSchema: OutputSchema = {
  fields: [{ key: 'blocks', label: 'Code Blocks' }, paginationField],
};

export const webflowListCustomDomainsOutputSchema: OutputSchema = {
  fields: [{ key: 'customDomains', label: 'Custom Domains' }],
};

export const webflowListCustomFontsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'customFonts',
      label: 'Custom Fonts',
      labelKey: 'fontFamily',
      listItems: customFontFields,
    },
    paginationField,
  ],
};

export const webflowListFormSubmissionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'formSubmissions',
      label: 'Form Submissions',
      labelKey: 'displayName',
      listItems: [
        ...formSubmissionFields,
        submissionSchemaField,
        ...formSubmissionElementFields,
      ],
    },
    paginationField,
  ],
};

export const webflowListFormsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'forms',
      label: 'Forms',
      labelKey: 'displayName',
      listItems: formFields,
    },
    paginationField,
  ],
};

export const webflowListGoogleTagsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'googleTagIds',
      label: 'Google Tags',
      labelKey: 'displayName',
      listItems: googleTagFields,
    },
  ],
};

export const webflowListLiveCollectionItemsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'id',
      listItems: collectionItemFields,
    },
    paginationField,
  ],
};

export const webflowListPagesOutputSchema: OutputSchema = {
  fields: [
    { key: 'pages', label: 'Pages', labelKey: 'title', listItems: pageFields },
    paginationField,
  ],
};

export const webflowListRegisteredScriptsOutputSchema: OutputSchema = {
  fields: [
    { key: 'registeredScripts', label: 'Registered Scripts' },
    paginationField,
  ],
};

export const webflowListSitesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'sites',
      label: 'Sites',
      labelKey: 'displayName',
      listItems: siteFields,
    },
  ],
};

export const webflowPublishSiteOutputSchema: OutputSchema = {
  fields: [
    { key: 'customDomains', label: 'Custom Domains' },
    {
      key: 'publishToWebflowSubdomain',
      label: 'Published To Webflow Subdomain',
      format: 'boolean',
    },
    { key: 'publishTaskId', label: 'Publish Task ID' },
    { key: 'publishScope', label: 'Publish Scope' },
  ],
};

export const webflowRegisterHostedScriptOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Script ID' },
    { key: 'canCopy', label: 'Can Copy', format: 'boolean' },
    { key: 'displayName', label: 'Name' },
    { key: 'hostedLocation', label: 'Hosted Location', format: 'url' },
    { key: 'integrityHash', label: 'Integrity Hash' },
    { key: 'createdOn', label: 'Created On', format: 'datetime' },
    { key: 'version', label: 'Version' },
  ],
};

export const webflowUpdateCollectionOutputSchema: OutputSchema = {
  fields: collectionUpdateFields,
};

export const webflowUpdateCollectionItemsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'id',
      listItems: collectionItemFields,
    },
  ],
};

export const webflowUpdateFormSubmissionOutputSchema: OutputSchema = {
  fields: [...formSubmissionFields, ...formSubmissionElementFields],
};

export const webflowUpdateLiveCollectionItemsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Items',
      labelKey: 'id',
      listItems: collectionItemFields,
    },
  ],
};

export const webflowUploadAssetOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Asset ID' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'parentFolder', label: 'Parent Folder ID' },
    { key: 'assetUrl', label: 'Asset URL', format: 'image' },
    { key: 'hostedUrl', label: 'Hosted URL', format: 'image' },
    { key: 'originalFileName', label: 'Original File Name' },
    { key: 'createdOn', label: 'Created On', format: 'datetime' },
    { key: 'lastUpdated', label: 'Last Updated', format: 'datetime' },
  ],
};

export const webflowUpsertGoogleTagsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'googleTagIds',
      label: 'Google Tags',
      labelKey: 'displayName',
      listItems: googleTagFields,
    },
  ],
};

export const deleteCollectionItemOutputSchema: OutputSchema = {
  fields: [...deletedFields, { key: 'collectionItemId', label: 'Item ID' }],
};

export const webflowDeleteCollectionOutputSchema: OutputSchema = {
  fields: [...deletedFields, { key: 'collectionId', label: 'Collection ID' }],
};

export const webflowDeleteCollectionFieldOutputSchema: OutputSchema = {
  fields: [
    ...deletedFields,
    { key: 'collectionId', label: 'Collection ID' },
    { key: 'fieldId', label: 'Field ID' },
  ],
};

export const webflowDeleteCollectionItemOutputSchema: OutputSchema = {
  fields: [
    ...deletedFields,
    { key: 'collectionId', label: 'Collection ID' },
    { key: 'itemId', label: 'Item ID' },
  ],
};

export const webflowDeleteCustomFontOutputSchema: OutputSchema = {
  fields: [
    ...deletedFields,
    { key: 'siteId', label: 'Site ID' },
    { key: 'fontId', label: 'Font ID' },
  ],
};

export const webflowDeleteGoogleTagOutputSchema: OutputSchema = {
  fields: [
    ...deletedFields,
    { key: 'siteId', label: 'Site ID' },
    { key: 'tagId', label: 'Tag ID' },
  ],
};

export const webflowDeleteGoogleTagsOutputSchema: OutputSchema = {
  fields: [...deletedFields, { key: 'siteId', label: 'Site ID' }],
};

export const webflowDeletePageCustomCodeOutputSchema: OutputSchema = {
  fields: [...deletedFields, { key: 'pageId', label: 'Page ID' }],
};

export const orderOutputSchema: OutputSchema = {
  fields: [
    { key: 'orderId', label: 'Order ID' },
    { key: 'status', label: 'Status' },
    { key: 'comment', label: 'Comment' },
    { key: 'orderComment', label: 'Customer Comment' },
    { key: 'acceptedOn', label: 'Accepted On', format: 'datetime' },
    { key: 'fulfilledOn', label: 'Fulfilled On', format: 'datetime' },
    { key: 'refundedOn', label: 'Refunded On', format: 'datetime' },
    { key: 'disputedOn', label: 'Disputed On', format: 'datetime' },
    { key: 'disputeLastStatus', label: 'Dispute Status' },
    { key: 'customerPaid', label: 'Customer Paid', children: moneyFields },
    { key: 'netAmount', label: 'Net Amount', children: moneyFields },
    {
      key: 'customerInfo',
      label: 'Customer',
      children: [
        { key: 'fullName', label: 'Full Name' },
        { key: 'email', label: 'Email', format: 'email' },
      ],
    },
    {
      key: 'shippingAddress',
      label: 'Shipping Address',
      children: [
        { key: 'addressee', label: 'Addressee' },
        { key: 'line1', label: 'Line 1' },
        { key: 'line2', label: 'Line 2' },
        { key: 'city', label: 'City' },
        { key: 'state', label: 'State' },
        { key: 'country', label: 'Country' },
        { key: 'postalCode', label: 'Postal Code' },
      ],
    },
    { key: 'shippingProvider', label: 'Shipping Provider' },
    { key: 'shippingTracking', label: 'Tracking Number' },
    { key: 'shippingTrackingURL', label: 'Tracking URL', format: 'url' },
    {
      key: 'purchasedItems',
      label: 'Purchased Items',
      labelKey: 'productName',
      listItems: [
        { key: 'productId', label: 'Product ID' },
        { key: 'productName', label: 'Product Name' },
        { key: 'variantId', label: 'Variant ID' },
        { key: 'variantName', label: 'Variant Name' },
        { key: 'variantSKU', label: 'Variant SKU' },
        { key: 'count', label: 'Quantity', format: 'number' },
      ],
    },
    {
      key: 'purchasedItemsCount',
      label: 'Purchased Items Count',
      format: 'number',
    },
    {
      key: 'isShippingRequired',
      label: 'Shipping Required',
      format: 'boolean',
    },
    { key: 'paymentProcessor', label: 'Payment Processor' },
  ],
};
