import { OutputSchema } from '@activepieces/pieces-framework';

const columnFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'description', label: 'Description' },
  { key: 'columnGroup', label: 'Column Group' },
  {
    key: 'enforceUniqueValues',
    label: 'Enforce Unique Values',
    format: 'boolean',
  },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
  { key: 'indexed', label: 'Indexed', format: 'boolean' },
  { key: 'readOnly', label: 'Read Only', format: 'boolean' },
  { key: 'required', label: 'Required', format: 'boolean' },
];

const driveItemBaseFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'createdDateTime', label: 'Created', format: 'datetime' },
  { key: 'lastModifiedDateTime', label: 'Last Modified', format: 'datetime' },
  { key: 'size', label: 'Size', format: 'filesize' },
  { key: 'webUrl', label: 'Web URL', format: 'url' },
];

const baseItemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'createdDateTime', label: 'Created', format: 'datetime' },
  { key: 'eTag', label: 'ETag' },
  { key: 'lastModifiedDateTime', label: 'Last Modified', format: 'datetime' },
  { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
  { key: 'webUrl', label: 'Web URL', format: 'url' },
];

const listItemSystemFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'AppAuthorLookupId', label: 'App Author ID' },
  { key: 'AppEditorLookupId', label: 'App Editor ID' },
  { key: 'Attachments', label: 'Attachments', format: 'boolean' },
  { key: 'AuthorLookupId', label: 'Author ID' },
  { key: '_ComplianceFlags', label: 'Compliance Flags' },
  { key: '_ComplianceTag', label: 'Compliance Tag' },
  { key: '_ComplianceTagUserId', label: 'Compliance Tag User ID' },
  { key: '_ComplianceTagWrittenTime', label: 'Compliance Tag Written Time' },
  { key: 'Created', label: 'Created', format: 'datetime' },
  { key: 'Edit', label: 'Edit' },
  { key: 'EditorLookupId', label: 'Editor ID' },
  { key: 'FolderChildCount', label: 'Folder Child Count' },
  { key: 'ItemChildCount', label: 'Item Child Count' },
  { key: 'Modified', label: 'Modified', format: 'datetime' },
  { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
  { key: 'Title', label: 'Title' },
  { key: '_UIVersionString', label: 'Version' },
];

const contentTypeFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'group', label: 'Group' },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
  { key: 'parentId', label: 'Parent ID' },
  { key: 'readOnly', label: 'Read Only', format: 'boolean' },
  { key: 'sealed', label: 'Sealed', format: 'boolean' },
  {
    key: 'base',
    label: 'Base',
    children: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
      { key: 'description', label: 'Description' },
      { key: 'group', label: 'Group' },
      { key: 'hidden', label: 'Hidden', format: 'boolean' },
      { key: 'readOnly', label: 'Read Only', format: 'boolean' },
      { key: 'sealed', label: 'Sealed', format: 'boolean' },
    ],
  },
];

const publishingStateFields: OutputSchema['fields'] = [
  { key: 'level', label: 'Level' },
  { key: 'versionId', label: 'Version ID' },
  {
    key: 'checkedOutBy',
    label: 'Checked Out By',
    children: [
      {
        key: 'user',
        label: 'User',
        children: [
          { key: 'displayName', label: 'Display Name' },
          { key: 'email', label: 'Email', format: 'email' },
        ],
      },
    ],
  },
];

const titleAreaFields: OutputSchema['fields'] = [
  { key: 'title', label: 'Title' },
  { key: 'authorByline', label: 'Author Byline' },
  { key: 'authors', label: 'Authors' },
  {
    key: 'enableGradientEffect',
    label: 'Enable Gradient Effect',
    format: 'boolean',
  },
  { key: 'layout', label: 'Layout' },
  { key: 'showAuthor', label: 'Show Author', format: 'boolean' },
  { key: 'showPublishedDate', label: 'Show Published Date', format: 'boolean' },
  {
    key: 'showTextBlockAboveTitle',
    label: 'Show Text Block Above Title',
    format: 'boolean',
  },
  { key: 'textAlignment', label: 'Text Alignment' },
];

const pageFields: OutputSchema['fields'] = [
  ...baseItemFields,
  { key: 'name', label: 'Name' },
  { key: 'title', label: 'Title' },
  { key: 'pageLayout', label: 'Page Layout' },
  { key: 'promotionKind', label: 'Promotion Kind' },
  { key: 'reactions', label: 'Reactions' },
  { key: 'showComments', label: 'Show Comments', format: 'boolean' },
  {
    key: 'showRecommendedPages',
    label: 'Show Recommended Pages',
    format: 'boolean',
  },
  { key: 'thumbnailWebUrl', label: 'Thumbnail Web URL', format: 'image' },
  {
    key: 'contentType',
    label: 'Content Type',
    children: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ],
  },
  {
    key: 'createdBy',
    label: 'Created By',
    children: [
      {
        key: 'user',
        label: 'User',
        children: [
          { key: 'displayName', label: 'Display Name' },
          { key: 'email', label: 'Email', format: 'email' },
        ],
      },
    ],
  },
  {
    key: 'lastModifiedBy',
    label: 'Last Modified By',
    children: [
      {
        key: 'user',
        label: 'User',
        children: [
          { key: 'displayName', label: 'Display Name' },
          { key: 'email', label: 'Email', format: 'email' },
        ],
      },
    ],
  },
  {
    key: 'parentReference',
    label: 'Parent Reference',
    children: [{ key: 'siteId', label: 'Site ID' }],
  },
  {
    key: 'publishingState',
    label: 'Publishing State',
    children: publishingStateFields,
  },
  { key: 'titleArea', label: 'Title Area', children: titleAreaFields },
];

const userFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'email', label: 'Email', format: 'email' },
];

const identitySetFields: OutputSchema['fields'] = [
  {
    key: 'application',
    label: 'Application',
    children: [
      { key: 'id', label: 'ID' },
      { key: 'displayName', label: 'Display Name' },
    ],
  },
  { key: 'user', label: 'User', children: userFields },
];

const fileFacetFields: OutputSchema['fields'] = [
  { key: 'fileExtension', label: 'File Extension' },
  { key: 'mimeType', label: 'MIME Type' },
  {
    key: 'hashes',
    label: 'Hashes',
    children: [{ key: 'quickXorHash', label: 'Quick XOR Hash' }],
  },
];

const fileSystemInfoFields: OutputSchema['fields'] = [
  { key: 'createdDateTime', label: 'Created', format: 'datetime' },
  { key: 'lastModifiedDateTime', label: 'Last Modified', format: 'datetime' },
];

const parentReferenceFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'driveId', label: 'Drive ID' },
  { key: 'driveType', label: 'Drive Type' },
  { key: 'path', label: 'Path' },
  { key: 'siteId', label: 'Site ID' },
];

const driveItemFields: OutputSchema['fields'] = [
  ...driveItemBaseFields,
  { key: 'cTag', label: 'CTag' },
  { key: 'eTag', label: 'ETag' },
  { key: 'isAuthoritative', label: 'Is Authoritative', format: 'boolean' },
  {
    key: '@microsoft.graph.downloadUrl',
    label: 'Download URL',
    value: "['@microsoft.graph.downloadUrl']",
    format: 'url',
  },
  {
    key: '@microsoft.graph.downloadUrlNoAuth',
    label: 'Download URL (No Auth)',
    value: "['@microsoft.graph.downloadUrlNoAuth']",
    format: 'url',
  },
  { key: 'createdBy', label: 'Created By', children: identitySetFields },
  { key: 'file', label: 'File', children: fileFacetFields },
  {
    key: 'fileSystemInfo',
    label: 'File System Info',
    children: fileSystemInfoFields,
  },
  {
    key: 'lastModifiedBy',
    label: 'Last Modified By',
    children: identitySetFields,
  },
  {
    key: 'parentReference',
    label: 'Parent Reference',
    children: parentReferenceFields,
  },
  {
    key: 'shared',
    label: 'Shared',
    children: [{ key: 'scope', label: 'Scope' }],
  },
];

const uploadedDriveItemFields: OutputSchema['fields'] = [
  ...driveItemBaseFields,
  { key: 'cTag', label: 'CTag' },
  { key: 'eTag', label: 'ETag' },
  { key: 'isAuthoritative', label: 'Is Authoritative', format: 'boolean' },
  {
    key: '@microsoft.graph.downloadUrl',
    label: 'Download URL',
    value: "['@microsoft.graph.downloadUrl']",
    format: 'url',
  },
  { key: 'createdBy', label: 'Created By', children: identitySetFields },
  {
    key: 'file',
    label: 'File',
    children: [
      { key: 'mimeType', label: 'MIME Type' },
      {
        key: 'hashes',
        label: 'Hashes',
        children: [{ key: 'quickXorHash', label: 'Quick XOR Hash' }],
      },
    ],
  },
  {
    key: 'fileSystemInfo',
    label: 'File System Info',
    children: fileSystemInfoFields,
  },
  {
    key: 'lastModifiedBy',
    label: 'Last Modified By',
    children: identitySetFields,
  },
  {
    key: 'parentReference',
    label: 'Parent Reference',
    children: parentReferenceFields,
  },
  {
    key: 'shared',
    label: 'Shared',
    children: [{ key: 'scope', label: 'Scope' }],
  },
];

const driveItemFileFields: OutputSchema['fields'] = [
  ...driveItemBaseFields,
  { key: 'cTag', label: 'CTag' },
  { key: 'eTag', label: 'ETag' },
  { key: 'isAuthoritative', label: 'Is Authoritative', format: 'boolean' },
  {
    key: '@microsoft.graph.downloadUrl',
    label: 'Download URL',
    value: "['@microsoft.graph.downloadUrl']",
    format: 'url',
  },
  {
    key: '@microsoft.graph.downloadUrlNoAuth',
    label: 'Download URL (No Auth)',
    value: "['@microsoft.graph.downloadUrlNoAuth']",
    format: 'url',
  },
  {
    key: 'createdBy',
    label: 'Created By',
    children: [{ key: 'user', label: 'User', children: userFields }],
  },
  { key: 'file', label: 'File', children: fileFacetFields },
  {
    key: 'fileSystemInfo',
    label: 'File System Info',
    children: fileSystemInfoFields,
  },
  {
    key: 'lastModifiedBy',
    label: 'Last Modified By',
    children: [{ key: 'user', label: 'User', children: userFields }],
  },
  {
    key: 'parentReference',
    label: 'Parent Reference',
    children: parentReferenceFields,
  },
  {
    key: 'shared',
    label: 'Shared',
    children: [{ key: 'scope', label: 'Scope' }],
  },
];

const driveFolderFields: OutputSchema['fields'] = [
  ...driveItemBaseFields,
  { key: 'eTag', label: 'ETag' },
  { key: 'isAuthoritative', label: 'Is Authoritative', format: 'boolean' },
  { key: 'createdBy', label: 'Created By', children: identitySetFields },
  {
    key: 'fileSystemInfo',
    label: 'File System Info',
    children: fileSystemInfoFields,
  },
  {
    key: 'folder',
    label: 'Folder',
    children: [{ key: 'childCount', label: 'Child Count', format: 'number' }],
  },
  {
    key: 'lastModifiedBy',
    label: 'Last Modified By',
    children: identitySetFields,
  },
  {
    key: 'parentReference',
    label: 'Parent Reference',
    children: parentReferenceFields,
  },
  {
    key: 'shared',
    label: 'Shared',
    children: [{ key: 'scope', label: 'Scope' }],
  },
];

const textColumnFields: OutputSchema['fields'] = [
  {
    key: 'allowMultipleLines',
    label: 'Allow Multiple Lines',
    format: 'boolean',
  },
  {
    key: 'appendChangesToExistingText',
    label: 'Append Changes To Existing Text',
    format: 'boolean',
  },
  { key: 'linesForEditing', label: 'Lines For Editing', format: 'number' },
  { key: 'maxLength', label: 'Max Length', format: 'number' },
];

const validationFields: OutputSchema['fields'] = [
  { key: 'defaultLanguage', label: 'Default Language' },
  {
    key: 'descriptions',
    label: 'Descriptions',
    listItems: [{ key: 'languageTag', label: 'Language Tag' }],
  },
];

const contentTypeColumnFields: OutputSchema['fields'] = [
  ...columnFields,
  { key: 'isDeletable', label: 'Is Deletable', format: 'boolean' },
  { key: 'isReorderable', label: 'Is Reorderable', format: 'boolean' },
  { key: 'isSealed', label: 'Is Sealed', format: 'boolean' },
  { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
  { key: 'propagateChanges', label: 'Propagate Changes', format: 'boolean' },
  { key: 'type', label: 'Type' },
  {
    key: 'sourceContentType',
    label: 'Source Content Type',
    children: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ],
  },
  { key: 'text', label: 'Text', children: textColumnFields },
  { key: 'validation', label: 'Validation', children: validationFields },
];

const listItemColumnValueFields: OutputSchema['fields'] = [
  ...listItemSystemFields,
  { key: 'ContentType', label: 'Content Type' },
  { key: 'LinkTitle', label: 'Link Title' },
  { key: 'LinkTitleNoMenu', label: 'Link Title (No Menu)' },
];

const listItemFields: OutputSchema['fields'] = [
  ...baseItemFields,
  {
    key: 'contentType',
    label: 'Content Type',
    children: [
      { key: 'id', label: 'ID' },
      { key: 'name', label: 'Name' },
    ],
  },
  {
    key: 'createdBy',
    label: 'Created By',
    children: [{ key: 'user', label: 'User', children: userFields }],
  },
  { key: 'fields', label: 'Fields', children: listItemColumnValueFields },
  {
    key: 'lastModifiedBy',
    label: 'Last Modified By',
    children: identitySetFields,
  },
  {
    key: 'parentReference',
    label: 'Parent Reference',
    children: [
      { key: 'id', label: 'ID' },
      { key: 'siteId', label: 'Site ID' },
    ],
  },
];

const driveFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'createdDateTime', label: 'Created', format: 'datetime' },
  { key: 'driveType', label: 'Drive Type' },
  { key: 'lastModifiedDateTime', label: 'Last Modified', format: 'datetime' },
  { key: 'webUrl', label: 'Web URL', format: 'url' },
  {
    key: 'createdBy',
    label: 'Created By',
    children: [
      {
        key: 'user',
        label: 'User',
        children: [{ key: 'displayName', label: 'Display Name' }],
      },
    ],
  },
  {
    key: 'owner',
    label: 'Owner',
    children: [
      {
        key: 'group',
        label: 'Group',
        children: [
          { key: 'id', label: 'ID' },
          { key: 'displayName', label: 'Display Name' },
        ],
      },
    ],
  },
  {
    key: 'quota',
    label: 'Quota',
    children: [
      { key: 'deleted', label: 'Deleted', format: 'number' },
      { key: 'remaining', label: 'Remaining', format: 'filesize' },
      { key: 'state', label: 'State' },
      { key: 'total', label: 'Total', format: 'filesize' },
      { key: 'used', label: 'Used', format: 'filesize' },
    ],
  },
];

const documentSetVersionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'comment', label: 'Comment' },
  { key: 'createdDateTime', label: 'Created', format: 'datetime' },
  { key: 'items', label: 'Items' },
  { key: 'lastModifiedDateTime', label: 'Last Modified', format: 'datetime' },
  {
    key: 'shouldCaptureMinorVersion',
    label: 'Capture Minor Version',
    format: 'boolean',
  },
  {
    key: 'createdBy',
    label: 'Created By',
    children: [
      {
        key: 'user',
        label: 'User',
        children: [
          { key: 'displayName', label: 'Display Name' },
          { key: 'email', label: 'Email', format: 'email' },
        ],
      },
    ],
  },
  {
    key: 'lastModifiedBy',
    label: 'Last Modified By',
    children: [
      {
        key: 'user',
        label: 'User',
        children: [
          { key: 'displayName', label: 'Display Name' },
          { key: 'email', label: 'Email', format: 'email' },
        ],
      },
    ],
  },
];

const fileVersionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'lastModifiedDateTime', label: 'Last Modified', format: 'datetime' },
  {
    key: '@microsoft.graph.downloadUrl',
    label: 'Download URL',
    value: "['@microsoft.graph.downloadUrl']",
    format: 'url',
  },
  { key: 'size', label: 'Size', format: 'filesize' },
  {
    key: 'lastModifiedBy',
    label: 'Last Modified By',
    children: identitySetFields,
  },
];

const siteUserFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'loginName', label: 'Login Name' },
];

const grantedToIdentitiesFields: OutputSchema['fields'] = [
  {
    key: 'group',
    label: 'Group',
    children: [
      { key: 'id', label: 'ID' },
      { key: 'displayName', label: 'Display Name' },
    ],
  },
  {
    key: 'sharePointGroup',
    label: 'SharePoint Group',
    children: [
      { key: 'id', label: 'ID' },
      { key: 'title', label: 'Title' },
      { key: 'principalId', label: 'Principal ID' },
    ],
  },
  { key: 'siteGroup', label: 'Site Group', children: siteUserFields },
  { key: 'siteUser', label: 'Site User', children: siteUserFields },
];

const listFacetFields: OutputSchema['fields'] = [
  {
    key: 'contentTypesEnabled',
    label: 'Content Types Enabled',
    format: 'boolean',
  },
  { key: 'hidden', label: 'Hidden', format: 'boolean' },
  { key: 'template', label: 'Template' },
];

const listFields: OutputSchema['fields'] = [
  ...baseItemFields,
  { key: 'name', label: 'Name' },
  { key: 'displayName', label: 'Display Name' },
  { key: 'description', label: 'Description' },
  {
    key: 'createdBy',
    label: 'Created By',
    children: [
      {
        key: 'user',
        label: 'User',
        children: [{ key: 'displayName', label: 'Display Name' }],
      },
    ],
  },
  { key: 'list', label: 'List', children: listFacetFields },
  {
    key: 'parentReference',
    label: 'Parent Reference',
    children: [{ key: 'siteId', label: 'Site ID' }],
  },
];

const incompleteDataFields: OutputSchema['fields'] = [
  { key: 'notSupported', label: 'Not Supported', format: 'boolean' },
  { key: 'resultsPending', label: 'Results Pending', format: 'boolean' },
  { key: 'wasThrottled', label: 'Was Throttled', format: 'boolean' },
];

const analyticsIntervalFields: OutputSchema['fields'] = [
  { key: 'aggregationInterval', label: 'Aggregation Interval' },
  { key: 'endDateTime', label: 'End', format: 'datetime' },
  { key: 'startDateTime', label: 'Start', format: 'datetime' },
  {
    key: 'incompleteData',
    label: 'Incomplete Data',
    children: incompleteDataFields,
  },
];

const listItemVersionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'lastModifiedDateTime', label: 'Last Modified', format: 'datetime' },
  { key: 'fields', label: 'Fields', children: [...listItemSystemFields] },
  {
    key: 'lastModifiedBy',
    label: 'Last Modified By',
    children: [{ key: 'user', label: 'User', children: userFields }],
  },
];

const lookupColumnFields: OutputSchema['fields'] = [
  {
    key: 'allowMultipleValues',
    label: 'Allow Multiple Values',
    format: 'boolean',
  },
  {
    key: 'allowUnlimitedLength',
    label: 'Allow Unlimited Length',
    format: 'boolean',
  },
  { key: 'columnName', label: 'Column Name' },
  { key: 'listId', label: 'List ID' },
  { key: 'primaryLookupColumnId', label: 'Primary Lookup Column ID' },
];

const identitySetEmailFields: OutputSchema['fields'] = [
  {
    key: 'application',
    label: 'Application',
    children: [
      { key: 'id', label: 'ID' },
      { key: 'displayName', label: 'Display Name' },
    ],
  },
  {
    key: 'user',
    label: 'User',
    children: [
      { key: 'displayName', label: 'Display Name' },
      { key: 'email', label: 'Email', format: 'email' },
    ],
  },
];

const identitySetAppNameFields: OutputSchema['fields'] = [
  {
    key: 'application',
    label: 'Application',
    children: [{ key: 'displayName', label: 'Display Name' }],
  },
  { key: 'user', label: 'User', children: userFields },
];

const userDetailFields: OutputSchema['fields'] = [
  { key: 'displayName', label: 'Display Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'self', label: 'Self' },
  { key: 'userPrincipalName', label: 'User Principal Name', format: 'email' },
];

const numberColumnFields: OutputSchema['fields'] = [
  { key: 'decimalPlaces', label: 'Decimal Places' },
  { key: 'displayAs', label: 'Display As' },
  { key: 'maximum', label: 'Maximum', format: 'number' },
  { key: 'minimum', label: 'Minimum', format: 'number' },
];

const accessStatsFields: OutputSchema['fields'] = [
  { key: 'actionCount', label: 'Action Count', format: 'number' },
  { key: 'actorCount', label: 'Actor Count', format: 'number' },
  { key: 'timeSpentInSeconds', label: 'Time Spent', format: 'duration' },
];

const sharingLinkFields: OutputSchema['fields'] = [
  { key: 'preventsDownload', label: 'Prevents Download', format: 'boolean' },
  { key: 'scope', label: 'Scope' },
  { key: 'type', label: 'Type' },
  { key: 'webUrl', label: 'Web URL', format: 'url' },
];

const personOrGroupColumnFields: OutputSchema['fields'] = [
  {
    key: 'allowMultipleSelection',
    label: 'Allow Multiple Selection',
    format: 'boolean',
  },
  { key: 'chooseFromType', label: 'Choose From Type' },
  { key: 'displayAs', label: 'Display As' },
];

const thumbnailFields: OutputSchema['fields'] = [
  { key: 'height', label: 'Height', format: 'number' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'width', label: 'Width', format: 'number' },
];

const contentTypeDetailFields: OutputSchema['fields'] = [
  ...contentTypeFields,
  { key: 'isBuiltIn', label: 'Built-In', format: 'boolean' },
  { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
];

const sharepointIdsFields: OutputSchema['fields'] = [
  { key: 'siteId', label: 'Site ID' },
  { key: 'siteUrl', label: 'Site URL', format: 'url' },
  { key: 'webId', label: 'Web ID' },
];

const horizontalSectionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'emphasis', label: 'Emphasis' },
  { key: 'layout', label: 'Layout' },
];

export const microsoftSharepointAddContentTypeColumnOutputSchema: OutputSchema =
  {
    fields: [
      ...columnFields,
      { key: 'isDeletable', label: 'Is Deletable', format: 'boolean' },
      { key: 'isReorderable', label: 'Is Reorderable', format: 'boolean' },
      { key: 'isSealed', label: 'Is Sealed', format: 'boolean' },
      { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
      {
        key: 'propagateChanges',
        label: 'Propagate Changes',
        format: 'boolean',
      },
      { key: 'type', label: 'Type' },
      { key: 'text', label: 'Text', children: textColumnFields },
      { key: 'validation', label: 'Validation', children: validationFields },
    ],
  };

export const microsoftSharepointAddContentTypeToListOutputSchema: OutputSchema =
  {
    fields: [
      ...contentTypeFields,
      { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
    ],
  };

export const microsoftSharepointAddListContentTypeColumnOutputSchema: OutputSchema =
  {
    fields: [
      ...columnFields,
      { key: 'isDeletable', label: 'Is Deletable', format: 'boolean' },
      { key: 'isReorderable', label: 'Is Reorderable', format: 'boolean' },
      { key: 'isSealed', label: 'Is Sealed', format: 'boolean' },
      { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
      {
        key: 'propagateChanges',
        label: 'Propagate Changes',
        format: 'boolean',
      },
      { key: 'type', label: 'Type' },
      { key: 'number', label: 'Number', children: numberColumnFields },
      { key: 'validation', label: 'Validation', children: validationFields },
    ],
  };

export const microsoftSharepointAddSectionWebPartOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'innerHtml', label: 'Inner HTML', format: 'html' },
  ],
};

export const microsoftSharepointCheckInFileOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const microsoftSharepointCopyFileToDefaultContentLocationOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'contentTypeId', label: 'Content Type ID' },
      { key: 'success', label: 'Success', format: 'boolean' },
    ],
  };

export const microsoftSharepointCopyItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'resourceId', label: 'Resource ID' },
    { key: 'status', label: 'Status' },
    { key: 'success', label: 'Success', format: 'boolean' },
  ],
};

export const microsoftSharepointCreateContentTypeOutputSchema: OutputSchema = {
  fields: contentTypeDetailFields,
};

export const microsoftSharepointCreateDocumentSetVersionOutputSchema: OutputSchema =
  { fields: documentSetVersionFields };

export const microsoftSharepointCreateFolderOutputSchema: OutputSchema = {
  fields: driveFolderFields,
};

export const microsoftSharepointCreateHorizontalSectionOutputSchema: OutputSchema =
  { fields: horizontalSectionFields };

export const microsoftSharepointCreateListOutputSchema: OutputSchema = {
  fields: [
    ...baseItemFields,
    { key: 'name', label: 'Name' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'createdBy',
      label: 'Created By',
      children: [
        {
          key: 'user',
          label: 'User',
          children: [
            { key: 'displayName', label: 'Display Name' },
            { key: 'email', label: 'Email', format: 'email' },
          ],
        },
      ],
    },
    { key: 'list', label: 'List', children: listFacetFields },
    {
      key: 'parentReference',
      label: 'Parent Reference',
      children: [{ key: 'siteId', label: 'Site ID' }],
    },
  ],
};

export const microsoftSharepointCreateListColumnOutputSchema: OutputSchema = {
  fields: [
    ...columnFields,
    { key: 'number', label: 'Number', children: numberColumnFields },
  ],
};

export const microsoftSharepointCreateListItemOutputSchema: OutputSchema = {
  fields: listItemFields,
};

export const microsoftSharepointCreatePageOutputSchema: OutputSchema = {
  fields: pageFields,
};

export const microsoftSharepointCreateSharingLinkOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'hasPassword', label: 'Has Password', format: 'boolean' },
    { key: 'roles', label: 'Roles' },
    { key: 'shareId', label: 'Share ID' },
    { key: 'link', label: 'Link', children: sharingLinkFields },
  ],
};

export const microsoftSharepointCreateSiteColumnOutputSchema: OutputSchema = {
  fields: [
    ...columnFields,
    { key: 'text', label: 'Text', children: textColumnFields },
  ],
};

export const microsoftSharepointCreateVerticalSectionOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'id', label: 'ID' },
      { key: 'emphasis', label: 'Emphasis' },
    ],
  };

export const microsoftSharepointDeleteDocumentSetVersionOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'documentSetVersionId', label: 'Document Set Version ID' },
      { key: 'listId', label: 'List ID' },
      { key: 'listItemId', label: 'List Item ID' },
      { key: 'siteId', label: 'Site ID' },
      { key: 'success', label: 'Success', format: 'boolean' },
    ],
  };

export const microsoftSharepointDeleteFilePermissionOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'permissionId', label: 'Permission ID' },
    ],
  };

export const microsoftSharepointDeleteHorizontalSectionOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'horizontalSectionId', label: 'Horizontal Section ID' },
      { key: 'pageId', label: 'Page ID' },
    ],
  };

export const microsoftSharepointDeletePageOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'pageId', label: 'Page ID' },
  ],
};

export const microsoftSharepointDeletePageWebPartOutputSchema: OutputSchema = {
  fields: [
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'pageId', label: 'Page ID' },
    { key: 'webPartId', label: 'Web Part ID' },
  ],
};

export const microsoftSharepointDeleteSectionWebPartOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'columnId', label: 'Column ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'horizontalSectionId', label: 'Horizontal Section ID' },
      { key: 'pageId', label: 'Page ID' },
      { key: 'webPartIndex', label: 'Web Part Index' },
    ],
  };

export const microsoftSharepointDeleteVerticalSectionWebPartOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'pageId', label: 'Page ID' },
      { key: 'webPartIndex', label: 'Web Part Index' },
    ],
  };

export const microsoftSharepointDownloadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'fileName', label: 'File Name' },
    { key: 'item', label: 'Item', children: driveItemFields },
  ],
};

export const microsoftSharepointDownloadFileVersionOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'file', label: 'File', format: 'url' },
      { key: 'fileName', label: 'File Name' },
      { key: 'version', label: 'Version', children: fileVersionFields },
    ],
  };

export const microsoftSharepointDownloadSharedFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'fileName', label: 'File Name' },
    {
      key: 'item',
      label: 'Item',
      children: [
        ...driveItemBaseFields,
        { key: 'cTag', label: 'CTag' },
        { key: 'eTag', label: 'ETag' },
        {
          key: 'isAuthoritative',
          label: 'Is Authoritative',
          format: 'boolean',
        },
        {
          key: '@microsoft.graph.downloadUrl',
          label: 'Download URL',
          value: "['@microsoft.graph.downloadUrl']",
          format: 'url',
        },
        {
          key: '@microsoft.graph.downloadUrlNoAuth',
          label: 'Download URL (No Auth)',
          value: "['@microsoft.graph.downloadUrlNoAuth']",
          format: 'url',
        },
        {
          key: 'createdBy',
          label: 'Created By',
          children: identitySetEmailFields,
        },
        { key: 'file', label: 'File', children: fileFacetFields },
        {
          key: 'fileSystemInfo',
          label: 'File System Info',
          children: fileSystemInfoFields,
        },
        {
          key: 'lastModifiedBy',
          label: 'Last Modified By',
          children: identitySetEmailFields,
        },
        {
          key: 'parentReference',
          label: 'Parent Reference',
          children: parentReferenceFields,
        },
        {
          key: 'shared',
          label: 'Shared',
          children: [{ key: 'scope', label: 'Scope' }],
        },
      ],
    },
  ],
};

export const microsoftSharepointExtractSensitivityLabelsOutputSchema: OutputSchema =
  { fields: [{ key: 'labels', label: 'Labels' }] };

export const microsoftSharepointFindFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    {
      key: 'files',
      label: 'Files',
      labelKey: 'name',
      listItems: driveItemFileFields,
    },
  ],
};

export const microsoftSharepointFindSiteOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'sites',
      label: 'Sites',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
      ],
    },
  ],
};

export const microsoftSharepointFollowDriveItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    {
      key: 'followed',
      label: 'Followed',
      children: [
        { key: 'followedDateTime', label: 'Followed At', format: 'datetime' },
      ],
    },
    {
      key: 'lastModifiedBy',
      label: 'Last Modified By',
      children: [{ key: 'user', label: 'User' }],
    },
    {
      key: 'parentReference',
      label: 'Parent Reference',
      children: [{ key: 'driveId', label: 'Drive ID' }],
    },
  ],
};

export const microsoftSharepointFollowSitesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Value',
      labelKey: 'displayName',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        {
          key: 'sharepointIds',
          label: 'SharePoint IDs',
          children: sharepointIdsFields,
        },
        {
          key: 'siteCollection',
          label: 'Site Collection',
          children: [{ key: 'hostname', label: 'Hostname' }],
        },
      ],
    },
  ],
};

export const microsoftSharepointGetContentTypeColumnOutputSchema: OutputSchema =
  { fields: contentTypeColumnFields };

export const microsoftSharepointGetDriveOutputSchema: OutputSchema = {
  fields: driveFields,
};

export const microsoftSharepointGetDriveChangesOutputSchema: OutputSchema = {
  fields: [
    {
      key: '@microsoft.graph.hasMoreData',
      label: 'Has More Data',
      value: "['@microsoft.graph.hasMoreData']",
      format: 'boolean',
    },
    {
      key: '@microsoft.graph.syncStatus',
      label: 'Sync Status',
      value: "['@microsoft.graph.syncStatus']",
    },
    {
      key: '@odata.deltaLink',
      label: 'Delta Link',
      value: "['@odata.deltaLink']",
      format: 'url',
    },
    {
      key: 'value',
      label: 'Value',
      labelKey: 'name',
      listItems: [
        ...driveItemBaseFields,
        { key: 'cTag', label: 'CTag' },
        { key: 'eTag', label: 'ETag' },
        {
          key: 'isAuthoritative',
          label: 'Is Authoritative',
          format: 'boolean',
        },
        { key: 'root', label: 'Root' },
        {
          key: 'createdBy',
          label: 'Created By',
          children: identitySetAppNameFields,
        },
        { key: 'file', label: 'File', children: fileFacetFields },
        {
          key: 'fileSystemInfo',
          label: 'File System Info',
          children: fileSystemInfoFields,
        },
        {
          key: 'folder',
          label: 'Folder',
          children: [
            { key: 'childCount', label: 'Child Count', format: 'number' },
          ],
        },
        {
          key: 'lastModifiedBy',
          label: 'Last Modified By',
          children: identitySetAppNameFields,
        },
        {
          key: 'parentReference',
          label: 'Parent Reference',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'driveId', label: 'Drive ID' },
            { key: 'driveType', label: 'Drive Type' },
            { key: 'path', label: 'Path' },
            { key: 'siteId', label: 'Site ID' },
          ],
        },
        {
          key: 'shared',
          label: 'Shared',
          children: [{ key: 'scope', label: 'Scope' }],
        },
      ],
    },
  ],
};

export const microsoftSharepointGetDriveItemOutputSchema: OutputSchema = {
  fields: driveItemFields,
};

export const microsoftSharepointGetFileActivityStatsOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'value', label: 'Value', listItems: analyticsIntervalFields },
    ],
  };

export const microsoftSharepointGetFileAnalyticsOutputSchema: OutputSchema = {
  fields: [
    { key: 'aggregationInterval', label: 'Aggregation Interval' },
    { key: 'endDateTime', label: 'End', format: 'datetime' },
    { key: 'isTrending', label: 'Is Trending', format: 'boolean' },
    { key: 'startDateTime', label: 'Start', format: 'datetime' },
    { key: 'access', label: 'Access', children: accessStatsFields },
    {
      key: 'incompleteData',
      label: 'Incomplete Data',
      children: [
        {
          key: 'missingDataBeforeDateTime',
          label: 'Missing Data Before',
          format: 'datetime',
        },
        { key: 'notSupported', label: 'Not Supported', format: 'boolean' },
        { key: 'resultsPending', label: 'Results Pending', format: 'boolean' },
        { key: 'wasThrottled', label: 'Was Throttled', format: 'boolean' },
      ],
    },
  ],
};

export const microsoftSharepointGetFilePermissionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'grantedToIdentities', label: 'Granted To Identities' },
    { key: 'grantedToIdentitiesV2', label: 'Granted To Identities V2' },
    { key: 'hasPassword', label: 'Has Password', format: 'boolean' },
    { key: 'roles', label: 'Roles' },
    { key: 'shareId', label: 'Share ID' },
    { key: 'link', label: 'Link', children: sharingLinkFields },
  ],
};

export const microsoftSharepointGetFilePreviewOutputSchema: OutputSchema = {
  fields: [
    { key: 'getUrl', label: 'Download URL', format: 'url' },
    { key: 'postParameters', label: 'Upload Parameters' },
    { key: 'postUrl', label: 'Upload URL', format: 'url' },
  ],
};

export const microsoftSharepointGetFileVersionOutputSchema: OutputSchema = {
  fields: fileVersionFields,
};

export const microsoftSharepointGetFolderContentsOutputSchema: OutputSchema = {
  itemLabel: '{name}',
  fields: [
    {
      key: 'contents',
      label: 'Contents',
      value: '',
      listItems: driveItemFileFields,
    },
  ],
};

export const microsoftSharepointGetListOutputSchema: OutputSchema = {
  fields: [
    ...baseItemFields,
    { key: 'name', label: 'Name' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'description', label: 'Description' },
    {
      key: 'createdBy',
      label: 'Created By',
      children: [{ key: 'user', label: 'User', children: userFields }],
    },
    { key: 'list', label: 'List', children: listFacetFields },
    {
      key: 'parentReference',
      label: 'Parent Reference',
      children: [{ key: 'siteId', label: 'Site ID' }],
    },
  ],
};

export const microsoftSharepointGetListContentTypeOutputSchema: OutputSchema = {
  fields: [
    ...contentTypeFields,
    { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
    {
      key: 'inheritedFrom',
      label: 'Inherited From',
      children: [
        {
          key: 'sharepointIds',
          label: 'SharePoint IDs',
          children: [
            { key: 'siteId', label: 'Site ID' },
            { key: 'siteUrl', label: 'Site URL', format: 'url' },
            { key: 'tenantId', label: 'Tenant ID' },
            { key: 'webId', label: 'Web ID' },
          ],
        },
      ],
    },
  ],
};

export const microsoftSharepointGetListContentTypeColumnOutputSchema: OutputSchema =
  {
    fields: [
      ...columnFields,
      { key: 'isDeletable', label: 'Is Deletable', format: 'boolean' },
      { key: 'isReorderable', label: 'Is Reorderable', format: 'boolean' },
      { key: 'isSealed', label: 'Is Sealed', format: 'boolean' },
      { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
      {
        key: 'propagateChanges',
        label: 'Propagate Changes',
        format: 'boolean',
      },
      { key: 'type', label: 'Type' },
      { key: 'number', label: 'Number', children: numberColumnFields },
      {
        key: 'sourceContentType',
        label: 'Source Content Type',
        children: [
          { key: 'id', label: 'ID' },
          { key: 'name', label: 'Name' },
        ],
      },
      { key: 'validation', label: 'Validation', children: validationFields },
    ],
  };

export const microsoftSharepointGetListItemAnalyticsOutputSchema: OutputSchema =
  { fields: analyticsIntervalFields };

export const microsoftSharepointGetListItemChangesOutputSchema: OutputSchema = {
  fields: [
    {
      key: '@odata.deltaLink',
      label: 'Delta Link',
      value: "['@odata.deltaLink']",
      format: 'url',
    },
    {
      key: 'value',
      label: 'Value',
      labelKey: 'id',
      listItems: [
        ...baseItemFields,
        {
          key: 'contentType',
          label: 'Content Type',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
          ],
        },
        { key: 'createdBy', label: 'Created By', children: identitySetFields },
        { key: 'fields', label: 'Fields', children: listItemColumnValueFields },
        {
          key: 'parentReference',
          label: 'Parent Reference',
          children: [{ key: 'siteId', label: 'Site ID' }],
        },
      ],
    },
  ],
};

export const microsoftSharepointGetListItemVersionOutputSchema: OutputSchema = {
  fields: listItemVersionFields,
};

export const microsoftSharepointGetPageOutputSchema: OutputSchema = {
  fields: [
    ...baseItemFields,
    { key: 'name', label: 'Name' },
    { key: 'title', label: 'Title' },
    { key: 'pageLayout', label: 'Page Layout' },
    { key: 'promotionKind', label: 'Promotion Kind' },
    { key: 'reactions', label: 'Reactions' },
    { key: 'showComments', label: 'Show Comments', format: 'boolean' },
    {
      key: 'showRecommendedPages',
      label: 'Show Recommended Pages',
      format: 'boolean',
    },
    { key: 'thumbnailWebUrl', label: 'Thumbnail Web URL', format: 'image' },
    {
      key: 'canvasLayout',
      label: 'Canvas Layout',
      children: [{ key: 'horizontalSections', label: 'Horizontal Sections' }],
    },
    {
      key: 'contentType',
      label: 'Content Type',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
    },
    {
      key: 'createdBy',
      label: 'Created By',
      children: [
        {
          key: 'user',
          label: 'User',
          children: [
            { key: 'displayName', label: 'Display Name' },
            { key: 'email', label: 'Email', format: 'email' },
          ],
        },
      ],
    },
    {
      key: 'lastModifiedBy',
      label: 'Last Modified By',
      children: [
        {
          key: 'user',
          label: 'User',
          children: [
            { key: 'displayName', label: 'Display Name' },
            { key: 'email', label: 'Email', format: 'email' },
          ],
        },
      ],
    },
    {
      key: 'parentReference',
      label: 'Parent Reference',
      children: [{ key: 'siteId', label: 'Site ID' }],
    },
    {
      key: 'publishingState',
      label: 'Publishing State',
      children: publishingStateFields,
    },
    { key: 'titleArea', label: 'Title Area', children: titleAreaFields },
  ],
};

export const microsoftSharepointGetRetentionLabelOutputSchema: OutputSchema = {
  fields: [],
};

export const microsoftSharepointRetentionLabelOutputSchema: OutputSchema = {
  fields: [
    { key: 'name', label: 'Label Name' },
    {
      key: 'isLabelAppliedExplicitly',
      label: 'Applied Explicitly',
      format: 'boolean',
    },
    { key: 'labelAppliedDateTime', label: 'Applied At', format: 'datetime' },
    {
      key: 'labelAppliedBy',
      label: 'Applied By',
      children: [
        {
          key: 'user',
          label: 'User',
          children: [
            { key: 'id', label: 'User ID' },
            { key: 'displayName', label: 'Display Name' },
            { key: 'email', label: 'Email', format: 'email' },
          ],
        },
      ],
    },
    {
      key: 'retentionSettings',
      label: 'Retention Settings',
      children: [
        {
          key: 'behaviorDuringRetentionPeriod',
          label: 'Behavior During Retention Period',
        },
        {
          key: 'isContentUpdateAllowed',
          label: 'Content Update Allowed',
          format: 'boolean',
        },
        { key: 'isDeleteAllowed', label: 'Delete Allowed', format: 'boolean' },
        {
          key: 'isLabelUpdateAllowed',
          label: 'Label Update Allowed',
          format: 'boolean',
        },
        {
          key: 'isMetadataUpdateAllowed',
          label: 'Metadata Update Allowed',
          format: 'boolean',
        },
        { key: 'isRecordLocked', label: 'Record Locked', format: 'boolean' },
      ],
    },
  ],
};

export const microsoftSharepointGetRootSiteOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'displayName', label: 'Display Name' },
    { key: 'description', label: 'Description' },
    { key: 'createdDateTime', label: 'Created', format: 'datetime' },
    { key: 'lastModifiedDateTime', label: 'Last Modified', format: 'datetime' },
    { key: 'root', label: 'Root' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    {
      key: 'siteCollection',
      label: 'Site Collection',
      children: [{ key: 'hostname', label: 'Hostname' }],
    },
  ],
};

export const microsoftSharepointGetSectionColumnOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'width', label: 'Width', format: 'number' },
  ],
};

export const microsoftSharepointGetSharedItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
  ],
};

export const microsoftSharepointGetSiteActivityStatsOutputSchema: OutputSchema =
  {
    fields: [{ key: '@odata.nextLink', label: 'Next Page Link', value: "['@odata.nextLink']", format: 'url' },
      {
        key: 'value',
        label: 'Value',
        listItems: [
          { key: 'aggregationInterval', label: 'Aggregation Interval' },
          { key: 'endDateTime', label: 'End', format: 'datetime' },
          { key: 'startDateTime', label: 'Start', format: 'datetime' },
          { key: 'access', label: 'Access', children: accessStatsFields },
          {
            key: 'incompleteData',
            label: 'Incomplete Data',
            children: incompleteDataFields,
          },
        ],
      },
    ],
  };

export const microsoftSharepointGetSiteAnalyticsOutputSchema: OutputSchema = {
  fields: [
    { key: 'aggregationInterval', label: 'Aggregation Interval' },
    { key: 'endDateTime', label: 'End', format: 'datetime' },
    { key: 'isTrending', label: 'Is Trending', format: 'boolean' },
    { key: 'startDateTime', label: 'Start', format: 'datetime' },
    { key: 'access', label: 'Access', children: accessStatsFields },
    {
      key: 'incompleteData',
      label: 'Incomplete Data',
      children: incompleteDataFields,
    },
  ],
};

export const microsoftSharepointGetSpecialFolderOutputSchema: OutputSchema = {
  fields: [
    ...driveItemBaseFields,
    { key: 'eTag', label: 'ETag' },
    { key: 'isAuthoritative', label: 'Is Authoritative', format: 'boolean' },
    { key: 'createdBy', label: 'Created By', children: identitySetFields },
    {
      key: 'fileSystemInfo',
      label: 'File System Info',
      children: fileSystemInfoFields,
    },
    {
      key: 'folder',
      label: 'Folder',
      children: [{ key: 'childCount', label: 'Child Count', format: 'number' }],
    },
    {
      key: 'lastModifiedBy',
      label: 'Last Modified By',
      children: identitySetFields,
    },
    {
      key: 'parentReference',
      label: 'Parent Reference',
      children: parentReferenceFields,
    },
    {
      key: 'specialFolder',
      label: 'Special Folder',
      children: [{ key: 'name', label: 'Name' }],
    },
  ],
};

export const microsoftSharepointGetVerticalSectionOutputSchema: OutputSchema = {
  fields: [{ key: 'emphasis', label: 'Emphasis' }],
};

export const microsoftSharepointGetWebPartPositionOutputSchema: OutputSchema = {
  fields: [
    { key: 'columnId', label: 'Column ID', format: 'number' },
    {
      key: 'horizontalSectionId',
      label: 'Horizontal Section ID',
      format: 'number',
    },
    {
      key: 'isInVerticalSection',
      label: 'In Vertical Section',
      format: 'boolean',
    },
    { key: 'webPartIndex', label: 'Web Part Index', format: 'number' },
  ],
};

export const microsoftSharepointGetWebPartsByPositionOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'value',
        label: 'Value',
        labelKey: 'id',
        listItems: [
          { key: 'id', label: 'ID' },
          { key: 'innerHtml', label: 'Inner HTML', format: 'html' },
        ],
      },
    ],
  };

export const microsoftSharepointGrantSharingLinkAccessOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'value',
        label: 'Value',
        labelKey: 'id',
        listItems: [
          { key: 'id', label: 'ID' },
          { key: 'grantedToIdentities', label: 'Granted To Identities' },
          { key: 'hasPassword', label: 'Has Password', format: 'boolean' },
          { key: 'roles', label: 'Roles' },
          { key: 'link', label: 'Link', children: sharingLinkFields },
        ],
      },
    ],
  };

export const microsoftSharepointInviteToFileOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Value',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'roles', label: 'Roles' },
        {
          key: 'grantedTo',
          label: 'Granted To',
          children: [{ key: 'user', label: 'User', children: userFields }],
        },
        {
          key: 'grantedToV2',
          label: 'Granted To V2',
          children: [{ key: 'user', label: 'User', children: userFields }],
        },
      ],
    },
  ],
};

export const microsoftSharepointListApplicableContentTypesOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: '@odata.nextLink',
        label: 'Next Page Link',
        value: "['@odata.nextLink']",
        format: 'url',
      },
      {
        key: 'value',
        label: 'Value',
        labelKey: 'name',
        listItems: [
          ...contentTypeFields,
          { key: 'isBuiltIn', label: 'Built-In', format: 'boolean' },
          { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
          {
            key: '@odata.id',
            label: 'OData ID',
            value: "['@odata.id']",
            format: 'url',
          },
        ],
      },
    ],
  };

export const microsoftSharepointListCompatibleHubContentTypesOutputSchema: OutputSchema =
  { fields: [{ key: 'value', label: 'Value' }] };

export const microsoftSharepointListContentTypeColumnsOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'value',
        label: 'Value',
        labelKey: 'name',
        listItems: contentTypeColumnFields,
      },
    ],
  };

export const microsoftSharepointListContentTypesOutputSchema: OutputSchema = {
  fields: [
    {
      key: '@odata.nextLink',
      label: 'Next Page Link',
      value: "['@odata.nextLink']",
      format: 'url',
    },
    {
      key: 'value',
      label: 'Value',
      labelKey: 'name',
      listItems: contentTypeDetailFields,
    },
  ],
};

export const microsoftSharepointListDocumentSetVersionsOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'value',
        label: 'Value',
        labelKey: 'id',
        listItems: documentSetVersionFields,
      },
    ],
  };

export const microsoftSharepointListDriveActivitiesOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: '@odata.nextLink',
        label: 'Next Page Link',
        value: "['@odata.nextLink']",
        format: 'url',
      },
      {
        key: 'value',
        label: 'Value',
        labelKey: 'id',
        listItems: [
          { key: 'id', label: 'ID' },
          {
            key: 'action',
            label: 'Action',
            children: [
              { key: 'edit', label: 'Edit' },
              {
                key: 'version',
                label: 'Version',
                children: [{ key: 'newVersion', label: 'New Version' }],
              },
            ],
          },
          {
            key: 'actor',
            label: 'Actor',
            children: [
              { key: 'user', label: 'User', children: userDetailFields },
            ],
          },
          {
            key: 'times',
            label: 'Times',
            children: [
              {
                key: 'recordedDateTime',
                label: 'Recorded At',
                format: 'datetime',
              },
            ],
          },
        ],
      },
    ],
  };

export const microsoftSharepointListFileActivitiesOutputSchema: OutputSchema = {
  fields: [{ key: '@odata.nextLink', label: 'Next Page Link', value: "['@odata.nextLink']", format: 'url' },
    {
      key: 'value',
      label: 'Value',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        {
          key: 'action',
          label: 'Action',
          children: [
            { key: 'create', label: 'Create' },
            { key: 'edit', label: 'Edit' },
            {
              key: 'version',
              label: 'Version',
              children: [{ key: 'newVersion', label: 'New Version' }],
            },
          ],
        },
        {
          key: 'actor',
          label: 'Actor',
          children: [
            { key: 'user', label: 'User', children: userDetailFields },
          ],
        },
        {
          key: 'times',
          label: 'Times',
          children: [
            {
              key: 'recordedDateTime',
              label: 'Recorded At',
              format: 'datetime',
            },
          ],
        },
      ],
    },
  ],
};

export const microsoftSharepointListFilePermissionsOutputSchema: OutputSchema =
  {
    fields: [{ key: '@odata.nextLink', label: 'Next Page Link', value: "['@odata.nextLink']", format: 'url' },
      {
        key: 'value',
        label: 'Value',
        labelKey: 'id',
        listItems: [
          { key: 'id', label: 'ID' },
          { key: 'grantedToIdentities', label: 'Granted To Identities' },
          { key: 'grantedToIdentitiesV2', label: 'Granted To Identities V2' },
          { key: 'hasPassword', label: 'Has Password', format: 'boolean' },
          { key: 'roles', label: 'Roles' },
          { key: 'shareId', label: 'Share ID' },
          {
            key: 'grantedTo',
            label: 'Granted To',
            children: [
              {
                key: 'user',
                label: 'User',
                children: [
                  { key: 'id', label: 'ID' },
                  { key: 'displayName', label: 'Display Name' },
                ],
              },
            ],
          },
          {
            key: 'grantedToV2',
            label: 'Granted To V2',
            children: grantedToIdentitiesFields,
          },
          { key: 'link', label: 'Link', children: sharingLinkFields },
        ],
      },
    ],
  };

export const microsoftSharepointListFileVersionsOutputSchema: OutputSchema = {
  fields: [{ key: '@odata.nextLink', label: 'Next Page Link', value: "['@odata.nextLink']", format: 'url' },
    {
      key: 'value',
      label: 'Value',
      labelKey: 'id',
      listItems: fileVersionFields,
    },
  ],
};

export const microsoftSharepointListFolderChildrenOutputSchema: OutputSchema = {
  fields: [{ key: '@odata.nextLink', label: 'Next Page Link', value: "['@odata.nextLink']", format: 'url' },
    {
      key: 'value',
      label: 'Value',
      labelKey: 'name',
      listItems: [
        ...driveItemBaseFields,
        { key: 'cTag', label: 'CTag' },
        { key: 'eTag', label: 'ETag' },
        {
          key: 'isAuthoritative',
          label: 'Is Authoritative',
          format: 'boolean',
        },
        {
          key: '@microsoft.graph.downloadUrl',
          label: 'Download URL',
          value: "['@microsoft.graph.downloadUrl']",
          format: 'url',
        },
        {
          key: '@microsoft.graph.downloadUrlNoAuth',
          label: 'Download URL (No Auth)',
          value: "['@microsoft.graph.downloadUrlNoAuth']",
          format: 'url',
        },
        { key: 'createdBy', label: 'Created By', children: identitySetFields },
        { key: 'file', label: 'File', children: fileFacetFields },
        {
          key: 'fileSystemInfo',
          label: 'File System Info',
          children: fileSystemInfoFields,
        },
        {
          key: 'folder',
          label: 'Folder',
          children: [
            { key: 'childCount', label: 'Child Count', format: 'number' },
          ],
        },
        {
          key: 'lastModifiedBy',
          label: 'Last Modified By',
          children: identitySetFields,
        },
        {
          key: 'parentReference',
          label: 'Parent Reference',
          children: parentReferenceFields,
        },
        {
          key: 'shared',
          label: 'Shared',
          children: [{ key: 'scope', label: 'Scope' }],
        },
      ],
    },
  ],
};

export const microsoftSharepointListFollowedSitesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Value',
      labelKey: 'displayName',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'displayName', label: 'Display Name' },
        { key: 'description', label: 'Description' },
        {
          key: 'lastModifiedDateTime',
          label: 'Last Modified',
          format: 'datetime',
        },
        { key: 'webUrl', label: 'Web URL', format: 'url' },
        {
          key: 'sharepointIds',
          label: 'SharePoint IDs',
          children: sharepointIdsFields,
        },
        {
          key: 'siteCollection',
          label: 'Site Collection',
          children: [{ key: 'hostname', label: 'Hostname' }],
        },
      ],
    },
  ],
};

export const microsoftSharepointListHorizontalSectionsOutputSchema: OutputSchema =
  {
    fields: [
      {
        key: 'value',
        label: 'Value',
        labelKey: 'id',
        listItems: horizontalSectionFields,
      },
    ],
  };

export const microsoftSharepointListListActivitiesOutputSchema: OutputSchema = {
  fields: [{ key: '@odata.nextLink', label: 'Next Page Link', value: "['@odata.nextLink']", format: 'url' },
    {
      key: 'value',
      label: 'Value',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        {
          key: 'action',
          label: 'Action',
          children: [{ key: 'create', label: 'Create' }],
        },
        {
          key: 'actor',
          label: 'Actor',
          children: [
            { key: 'user', label: 'User', children: userDetailFields },
          ],
        },
        {
          key: 'times',
          label: 'Times',
          children: [
            {
              key: 'recordedDateTime',
              label: 'Recorded At',
              format: 'datetime',
            },
          ],
        },
      ],
    },
  ],
};

export const microsoftSharepointListListColumnsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Value',
      labelKey: 'name',
      listItems: [
        ...columnFields,
        {
          key: 'dateTime',
          label: 'Date Time',
          children: [
            { key: 'displayAs', label: 'Display As' },
            { key: 'format', label: 'Format' },
          ],
        },
        { key: 'lookup', label: 'Lookup', children: lookupColumnFields },
        { key: 'number', label: 'Number', children: numberColumnFields },
        {
          key: 'personOrGroup',
          label: 'Person Or Group',
          children: personOrGroupColumnFields,
        },
        { key: 'text', label: 'Text', children: textColumnFields },
      ],
    },
  ],
};

export const microsoftSharepointListListContentTypeColumnsOutputSchema: OutputSchema =
  {
    fields: [{ key: '@odata.nextLink', label: 'Next Page Link', value: "['@odata.nextLink']", format: 'url' },
      {
        key: 'value',
        label: 'Value',
        labelKey: 'name',
        listItems: [
          ...columnFields,
          { key: 'isDeletable', label: 'Is Deletable', format: 'boolean' },
          { key: 'isReorderable', label: 'Is Reorderable', format: 'boolean' },
          { key: 'isSealed', label: 'Is Sealed', format: 'boolean' },
          { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
          {
            key: 'propagateChanges',
            label: 'Propagate Changes',
            format: 'boolean',
          },
          { key: 'type', label: 'Type' },
          { key: 'number', label: 'Number', children: numberColumnFields },
          {
            key: 'sourceContentType',
            label: 'Source Content Type',
            children: [
              { key: 'id', label: 'ID' },
              { key: 'name', label: 'Name' },
            ],
          },
          { key: 'text', label: 'Text', children: textColumnFields },
          {
            key: 'validation',
            label: 'Validation',
            children: validationFields,
          },
        ],
      },
    ],
  };

export const microsoftSharepointListListContentTypesOutputSchema: OutputSchema =
  {
    fields: [{ key: '@odata.nextLink', label: 'Next Page Link', value: "['@odata.nextLink']", format: 'url' },
      {
        key: 'value',
        label: 'Value',
        labelKey: 'name',
        listItems: [
          ...contentTypeFields,
          { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
        ],
      },
    ],
  };

export const microsoftSharepointListListItemPermissionsOutputSchema: OutputSchema =
  {
    fields: [{ key: '@odata.nextLink', label: 'Next Page Link', value: "['@odata.nextLink']", format: 'url' },
      {
        key: 'value',
        label: 'Value',
        labelKey: 'id',
        listItems: [
          { key: 'id', label: 'ID' },
          { key: 'inheritedFrom', label: 'Inherited From' },
          { key: 'roles', label: 'Roles' },
          { key: 'shareId', label: 'Share ID' },
          {
            key: 'grantedTo',
            label: 'Granted To',
            children: [
              {
                key: 'user',
                label: 'User',
                children: [
                  { key: 'id', label: 'ID' },
                  { key: 'displayName', label: 'Display Name' },
                ],
              },
            ],
          },
          {
            key: 'grantedToV2',
            label: 'Granted To V2',
            children: grantedToIdentitiesFields,
          },
        ],
      },
    ],
  };

export const microsoftSharepointListListItemVersionsOutputSchema: OutputSchema =
  {
    fields: [{ key: '@odata.nextLink', label: 'Next Page Link', value: "['@odata.nextLink']", format: 'url' },
      {
        key: 'value',
        label: 'Value',
        labelKey: 'id',
        listItems: listItemVersionFields,
      },
    ],
  };

export const microsoftSharepointListListItemsOutputSchema: OutputSchema = {
  fields: [{ key: '@odata.nextLink', label: 'Next Page Link', value: "['@odata.nextLink']", format: 'url' },
    {
      key: 'value',
      label: 'Value',
      labelKey: 'id',
      listItems: [
        ...baseItemFields,
        {
          key: 'contentType',
          label: 'Content Type',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'name', label: 'Name' },
          ],
        },
        {
          key: 'createdBy',
          label: 'Created By',
          children: [{ key: 'user', label: 'User', children: userFields }],
        },
        {
          key: 'fields',
          label: 'Fields',
          children: [
            ...listItemSystemFields,
            { key: '_CheckinComment', label: 'Check-in Comment' },
            { key: '_CommentCount', label: 'Comment Count' },
            { key: 'ContentType', label: 'Content Type' },
            { key: '_DisplayName', label: 'Display Name' },
            { key: 'DocIcon', label: 'Document Icon' },
            { key: 'FileLeafRef', label: 'File Name' },
            { key: 'FileSizeDisplay', label: 'File Size Display' },
            { key: '_LikeCount', label: 'Like Count' },
            { key: 'LinkFilename', label: 'Link Filename' },
            { key: 'LinkFilenameNoMenu', label: 'Link Filename (No Menu)' },
            { key: 'LinkTitle', label: 'Link Title' },
            { key: 'LinkTitleNoMenu', label: 'Link Title (No Menu)' },
            { key: 'ParentLeafNameLookupId', label: 'Parent Leaf Name ID' },
            { key: 'ParentVersionStringLookupId', label: 'Parent Version ID' },
          ],
        },
        {
          key: 'lastModifiedBy',
          label: 'Last Modified By',
          children: identitySetFields,
        },
        {
          key: 'parentReference',
          label: 'Parent Reference',
          children: [
            { key: 'id', label: 'ID' },
            { key: 'siteId', label: 'Site ID' },
          ],
        },
      ],
    },
  ],
};

export const microsoftSharepointListListsOutputSchema: OutputSchema = {
  fields: [
    {
      key: '@odata.nextLink',
      label: 'Next Page Link',
      value: "['@odata.nextLink']",
      format: 'url',
    },
    { key: 'value', label: 'Value', labelKey: 'name', listItems: listFields },
  ],
};

export const microsoftSharepointListPagesOutputSchema: OutputSchema = {
  fields: [{ key: '@odata.nextLink', label: 'Next Page Link', value: "['@odata.nextLink']", format: 'url' },
    { key: 'value', label: 'Value', labelKey: 'name', listItems: pageFields },
  ],
};

export const microsoftSharepointListSectionColumnsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Value',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'width', label: 'Width', format: 'number' },
      ],
    },
  ],
};

export const microsoftSharepointListSiteColumnsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Value',
      labelKey: 'name',
      listItems: [
        ...columnFields,
        { key: 'boolean', label: 'Boolean' },
        { key: 'geolocation', label: 'Geolocation' },
        {
          key: 'calculated',
          label: 'Calculated',
          children: [
            { key: 'formula', label: 'Formula' },
            { key: 'outputType', label: 'Output Type' },
          ],
        },
        {
          key: 'choice',
          label: 'Choice',
          children: [
            {
              key: 'allowTextEntry',
              label: 'Allow Text Entry',
              format: 'boolean',
            },
            { key: 'choices', label: 'Choices' },
            { key: 'displayAs', label: 'Display As' },
          ],
        },
        {
          key: 'dateTime',
          label: 'Date Time',
          children: [
            { key: 'displayAs', label: 'Display As' },
            { key: 'format', label: 'Format' },
          ],
        },
        {
          key: 'defaultValue',
          label: 'Default Value',
          children: [{ key: 'value', label: 'Value' }],
        },
        { key: 'lookup', label: 'Lookup', children: lookupColumnFields },
        { key: 'number', label: 'Number', children: numberColumnFields },
        {
          key: 'personOrGroup',
          label: 'Person Or Group',
          children: personOrGroupColumnFields,
        },
        {
          key: 'text',
          label: 'Text',
          children: [
            {
              key: 'allowMultipleLines',
              label: 'Allow Multiple Lines',
              format: 'boolean',
            },
            {
              key: 'appendChangesToExistingText',
              label: 'Append Changes To Existing Text',
              format: 'boolean',
            },
            {
              key: 'linesForEditing',
              label: 'Lines For Editing',
              format: 'number',
            },
            { key: 'maxLength', label: 'Max Length', format: 'number' },
            { key: 'textType', label: 'Text Type' },
          ],
        },
      ],
    },
  ],
};

export const microsoftSharepointListSiteDrivesOutputSchema: OutputSchema = {
  fields: [
    {
      key: '@odata.nextLink',
      label: 'Next Page Link',
      value: "['@odata.nextLink']",
      format: 'url',
    },
    { key: 'value', label: 'Value', labelKey: 'name', listItems: driveFields },
  ],
};

export const microsoftSharepointListThumbnailsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Value',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'ID' },
        { key: 'large', label: 'Large', children: thumbnailFields },
        { key: 'medium', label: 'Medium', children: thumbnailFields },
        { key: 'small', label: 'Small', children: thumbnailFields },
      ],
    },
  ],
};

export const microsoftSharepointMoveFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'message', label: 'Message' },
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'item', label: 'Item', children: uploadedDriveItemFields },
  ],
};

export const microsoftSharepointPublishPageOutputSchema: OutputSchema = {
  fields: [
    { key: 'message', label: 'Message' },
    { key: 'pageId', label: 'Page ID' },
    { key: 'siteId', label: 'Site ID' },
    { key: 'success', label: 'Success', format: 'boolean' },
  ],
};

export const microsoftSharepointReplaceFileContentOutputSchema: OutputSchema = {
  fields: uploadedDriveItemFields,
};

export const microsoftSharepointRestoreFileVersionOutputSchema: OutputSchema = {
  fields: [
    { key: 'driveId', label: 'Drive ID' },
    { key: 'itemId', label: 'Item ID' },
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'versionId', label: 'Version ID' },
  ],
};

export const microsoftSharepointRestoreListItemVersionOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'listId', label: 'List ID' },
      { key: 'listItemId', label: 'List Item ID' },
      { key: 'siteId', label: 'Site ID' },
      { key: 'success', label: 'Success', format: 'boolean' },
      { key: 'versionId', label: 'Version ID' },
    ],
  };

export const microsoftSharepointSearchOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Value',
      listItems: [
        { key: 'searchTerms', label: 'Search Terms' },
        {
          key: 'hitsContainers',
          label: 'Hits Containers',
          listItems: [
            {
              key: 'moreResultsAvailable',
              label: 'More Results Available',
              format: 'boolean',
            },
            { key: 'total', label: 'Total', format: 'number' },
            {
              key: 'hits',
              label: 'Hits',
              listItems: [
                { key: 'hitId', label: 'Hit ID' },
                { key: 'rank', label: 'Rank', format: 'number' },
                { key: 'summary', label: 'Summary' },
                {
                  key: 'resource',
                  label: 'Resource',
                  children: [
                    ...driveItemBaseFields,
                    {
                      key: 'createdBy',
                      label: 'Created By',
                      children: [{ key: 'user', label: 'User' }],
                    },
                    {
                      key: 'file',
                      label: 'File',
                      children: [{ key: 'mimeType', label: 'MIME Type' }],
                    },
                    {
                      key: 'fileSystemInfo',
                      label: 'File System Info',
                      children: fileSystemInfoFields,
                    },
                    {
                      key: 'lastModifiedBy',
                      label: 'Last Modified By',
                      children: [{ key: 'user', label: 'User' }],
                    },
                    {
                      key: 'listItem',
                      label: 'List Item',
                      children: [
                        { key: 'id', label: 'ID' },
                        { key: 'fields', label: 'Fields' },
                      ],
                    },
                    {
                      key: 'parentReference',
                      label: 'Parent Reference',
                      children: [
                        { key: 'id', label: 'ID' },
                        { key: 'driveId', label: 'Drive ID' },
                        { key: 'sharepointIds', label: 'SharePoint IDs' },
                        { key: 'siteId', label: 'Site ID' },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export const microsoftSharepointSearchListItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'value', label: 'Value', labelKey: 'id', listItems: listItemFields },
  ],
};

export const microsoftSharepointUnfollowSitesOutputSchema: OutputSchema = {
  fields: [
    { key: 'siteIds', label: 'Site IDs' },
    { key: 'success', label: 'Success', format: 'boolean' },
  ],
};

export const microsoftSharepointUpdateFilePermissionOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'id', label: 'ID' },
      { key: 'roles', label: 'Roles' },
      { key: 'shareId', label: 'Share ID' },
      {
        key: 'grantedTo',
        label: 'Granted To',
        children: [{ key: 'user', label: 'User', children: userFields }],
      },
      {
        key: 'grantedToV2',
        label: 'Granted To V2',
        children: [
          {
            key: 'siteUser',
            label: 'Site User',
            children: [
              { key: 'id', label: 'ID' },
              { key: 'displayName', label: 'Display Name' },
              { key: 'email', label: 'Email', format: 'email' },
              { key: 'loginName', label: 'Login Name' },
            ],
          },
          { key: 'user', label: 'User', children: userFields },
        ],
      },
    ],
  };

export const microsoftSharepointUpdateListItemOutputSchema: OutputSchema = {
  fields: listItemColumnValueFields,
};

export const microsoftSharepointUpdatePageOutputSchema: OutputSchema = {
  fields: [
    ...baseItemFields,
    { key: 'name', label: 'Name' },
    { key: 'title', label: 'Title' },
    { key: 'description', label: 'Description' },
    { key: 'pageLayout', label: 'Page Layout' },
    { key: 'promotionKind', label: 'Promotion Kind' },
    { key: 'reactions', label: 'Reactions' },
    { key: 'showComments', label: 'Show Comments', format: 'boolean' },
    {
      key: 'showRecommendedPages',
      label: 'Show Recommended Pages',
      format: 'boolean',
    },
    { key: 'thumbnailWebUrl', label: 'Thumbnail Web URL', format: 'image' },
    {
      key: 'contentType',
      label: 'Content Type',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'name', label: 'Name' },
      ],
    },
    {
      key: 'createdBy',
      label: 'Created By',
      children: [
        {
          key: 'user',
          label: 'User',
          children: [
            { key: 'displayName', label: 'Display Name' },
            { key: 'email', label: 'Email', format: 'email' },
          ],
        },
      ],
    },
    {
      key: 'lastModifiedBy',
      label: 'Last Modified By',
      children: [
        {
          key: 'user',
          label: 'User',
          children: [
            { key: 'displayName', label: 'Display Name' },
            { key: 'email', label: 'Email', format: 'email' },
          ],
        },
      ],
    },
    {
      key: 'parentReference',
      label: 'Parent Reference',
      children: [{ key: 'siteId', label: 'Site ID' }],
    },
    {
      key: 'publishingState',
      label: 'Publishing State',
      children: [
        { key: 'level', label: 'Level' },
        { key: 'versionId', label: 'Version ID' },
      ],
    },
    { key: 'titleArea', label: 'Title Area', children: titleAreaFields },
  ],
};

export const newFileInFolderOutputSchema: OutputSchema = {
  fields: [
    ...driveItemBaseFields,
    {
      key: 'file',
      label: 'File',
      children: [{ key: 'mimeType', label: 'MIME Type' }],
    },
    {
      key: 'parentReference',
      label: 'Parent Reference',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'driveId', label: 'Drive ID' },
        { key: 'path', label: 'Path' },
      ],
    },
  ],
};

export const newFileInSubfoldersOutputSchema: OutputSchema = {
  fields: [
    ...driveItemBaseFields,
    {
      key: 'file',
      label: 'File',
      children: [{ key: 'mimeType', label: 'MIME Type' }],
    },
    {
      key: 'parentReference',
      label: 'Parent Reference',
      children: [{ key: 'id', label: 'ID' }],
    },
  ],
};

export const newListOutputSchema: OutputSchema = { fields: listFields };

export const newListItemOutputSchema: OutputSchema = { fields: listItemFields };

export const newOrUpdatedFileOutputSchema: OutputSchema = {
  fields: driveItemFileFields,
};

export const newOrUpdatedFolderOutputSchema: OutputSchema = {
  fields: driveFolderFields,
};

export const updatedListItemOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'ID' },
    { key: 'createdDateTime', label: 'Created', format: 'datetime' },
    { key: 'lastModifiedDateTime', label: 'Last Modified', format: 'datetime' },
    { key: 'webUrl', label: 'Web URL', format: 'url' },
    {
      key: 'fields',
      label: 'Fields',
      children: [
        { key: 'id', label: 'ID' },
        { key: 'DueDate', label: 'Due Date', format: 'datetime' },
        { key: '@odata.etag', label: 'ETag', value: "['@odata.etag']" },
        { key: 'Priority', label: 'Priority' },
        { key: 'Status', label: 'Status' },
        { key: 'Title', label: 'Title' },
      ],
    },
  ],
};

export const microsoftSharepointGetOperationOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Operation ID' },
    { key: 'createdDateTime', label: 'Created', format: 'datetime' },
    { key: 'lastActionDateTime', label: 'Last Action At', format: 'datetime' },
    { key: 'percentageComplete', label: 'Percent Complete', format: 'number' },
    { key: 'resourceId', label: 'Resource ID' },
    { key: 'resourceLocation', label: 'Resource Location', format: 'url' },
    { key: 'status', label: 'Status' },
    { key: 'statusDetail', label: 'Status Detail' },
    { key: 'type', label: 'Type' },
    {
      key: 'error',
      label: 'Error',
      children: [
        { key: 'code', label: 'Code' },
        { key: 'message', label: 'Message' },
      ],
    },
  ],
};

export const microsoftSharepointUnfollowDriveItemOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const microsoftSharepointAddHubContentTypeOutputSchema: OutputSchema = {
  fields: [
    { key: 'operationId', label: 'Operation ID' },
    { key: 'operationLocation', label: 'Operation Location', format: 'url' },
    { key: 'status', label: 'Status' },
    {
      key: 'contentType',
      label: 'Content Type',
      children: [
        ...contentTypeFields,
        { key: 'isBuiltIn', label: 'Built-In', format: 'boolean' },
      ],
    },
  ],
};

export const microsoftSharepointAssociateContentTypeWithHubSitesOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'contentTypeId', label: 'Content Type ID' },
      { key: 'hubSiteUrls', label: 'Hub Site URLs' },
      { key: 'success', label: 'Success', format: 'boolean' },
    ],
  };

export const microsoftSharepointRemoveRetentionLabelOutputSchema: OutputSchema =
  { fields: [{ key: 'removed', label: 'Removed', format: 'boolean' }] };

export const microsoftSharepointAssignSensitivityLabelOutputSchema: OutputSchema =
  {
    fields: [
      { key: 'monitorUrl', label: 'Monitor URL', format: 'url' },
      { key: 'status', label: 'HTTP Status', format: 'number' },
    ],
  };
