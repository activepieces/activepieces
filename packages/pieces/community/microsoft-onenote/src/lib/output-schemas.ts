import { OutputSchema } from '@activepieces/pieces-framework';

const identityFields: OutputSchema['fields'] = [
  {
    key: 'user',
    label: 'User',
    children: [{ key: 'displayName', label: 'Name' }],
  },
];

const linkFields: OutputSchema['fields'] = [
  {
    key: 'oneNoteClientUrl',
    label: 'OneNote App Link',
    children: [{ key: 'href', label: 'URL' }],
  },
  {
    key: 'oneNoteWebUrl',
    label: 'OneNote Web Link',
    children: [{ key: 'href', label: 'URL', format: 'url' }],
  },
];

const auditFields: OutputSchema['fields'] = [
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
  { key: 'createdBy', label: 'Created By', children: identityFields },
  { key: 'lastModifiedBy', label: 'Last Modified By', children: identityFields },
];

const notebookFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Notebook ID' },
  { key: 'displayName', label: 'Name' },
  { key: 'isDefault', label: 'Is Default', format: 'boolean' },
  { key: 'isShared', label: 'Is Shared', format: 'boolean' },
  { key: 'userRole', label: 'Your Role' },
  ...auditFields,
  { key: 'links', label: 'Links', children: linkFields },
  { key: 'sectionsUrl', label: 'Sections API URL', format: 'url' },
  { key: 'sectionGroupsUrl', label: 'Section Groups API URL', format: 'url' },
  { key: 'self', label: 'API URL', format: 'url' },
];

const sectionGroupFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Section Group ID' },
  { key: 'displayName', label: 'Name' },
  ...auditFields,
  { key: 'sectionsUrl', label: 'Sections API URL', format: 'url' },
  { key: 'sectionGroupsUrl', label: 'Section Groups API URL', format: 'url' },
  { key: 'self', label: 'API URL', format: 'url' },
];

const sectionFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Section ID' },
  { key: 'displayName', label: 'Name' },
  { key: 'isDefault', label: 'Is Default', format: 'boolean' },
  ...auditFields,
  { key: 'pagesUrl', label: 'Pages API URL', format: 'url' },
  { key: 'self', label: 'API URL', format: 'url' },
];

const parentRefFields: OutputSchema['fields'] = [
  { key: 'id', label: 'ID' },
  { key: 'displayName', label: 'Name' },
  { key: 'self', label: 'API URL', format: 'url' },
];

const parentNotebookField: OutputSchema['fields'][number] = {
  key: 'parentNotebook',
  label: 'Parent Notebook',
  children: notebookFields,
};

const parentSectionGroupField: OutputSchema['fields'][number] = {
  key: 'parentSectionGroup',
  label: 'Parent Section Group',
  children: sectionGroupFields,
};

const pageFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Page ID' },
  { key: 'title', label: 'Title' },
  { key: 'createdDateTime', label: 'Created At', format: 'datetime' },
  { key: 'lastModifiedDateTime', label: 'Last Modified At', format: 'datetime' },
  { key: 'createdByAppId', label: 'Created By App ID' },
  { key: 'links', label: 'Links', children: linkFields },
  { key: 'contentUrl', label: 'Content API URL', format: 'url' },
  { key: 'self', label: 'API URL', format: 'url' },
];

const operationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Operation ID' },
  { key: 'status', label: 'Status' },
  { key: 'createdDateTime', label: 'Started At', format: 'datetime' },
  { key: 'lastActionDateTime', label: 'Last Updated At', format: 'datetime' },
];

export const microsoftOnenoteDeletePageOutputSchema: OutputSchema = {
  fields: [
    { key: 'pageId', label: 'Page ID' },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
  ],
};

export const microsoftOnenoteCreatePageOutputSchema: OutputSchema = {
  fields: pageFields,
};

export const appendNoteOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
    { key: 'pageId', label: 'Page ID' },
    { key: 'contentType', label: 'Content Type' },
    { key: 'appendedContent', label: 'Appended Content', format: 'html' },
  ],
};

export const createNoteInSectionOutputSchema: OutputSchema = {
  fields: pageFields,
};

export const createImageNoteOutputSchema: OutputSchema = {
  fields: [
    ...pageFields,
    { key: 'imageUrl', label: 'Image URL', format: 'image' },
    { key: 'imageWidth', label: 'Image Width', format: 'number' },
    { key: 'imageAltText', label: 'Image Alt Text' },
  ],
};

export const microsoftOnenoteOperationOutputSchema: OutputSchema = {
  fields: operationFields,
};

export const microsoftOnenoteCreateNotebookOutputSchema: OutputSchema = {
  fields: notebookFields,
};

export const createNotebookOutputSchema: OutputSchema = {
  fields: notebookFields,
};

export const microsoftOnenoteGetNotebookFromWebUrlOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Notebook ID' },
    { key: 'name', label: 'Name' },
    { key: 'isDefault', label: 'Is Default', format: 'boolean' },
    { key: 'isShared', label: 'Is Shared', format: 'boolean' },
    { key: 'userRole', label: 'Your Role' },
    { key: 'createdTime', label: 'Created At', format: 'datetime' },
    { key: 'lastModifiedTime', label: 'Last Modified At', format: 'datetime' },
    { key: 'createdBy', label: 'Created By' },
    { key: 'createdByIdentity', label: 'Created By Identity' },
    { key: 'lastModifiedBy', label: 'Last Modified By' },
    { key: 'lastModifiedByIdentity', label: 'Last Modified By Identity' },
    { key: 'links', label: 'Links', children: linkFields },
    { key: 'sectionsUrl', label: 'Sections API URL', format: 'url' },
    { key: 'sectionGroupsUrl', label: 'Section Groups API URL', format: 'url' },
    { key: 'self', label: 'API URL', format: 'url' },
  ],
};

export const microsoftOnenoteGetNotebookOutputSchema: OutputSchema = {
  fields: notebookFields,
};

export const microsoftOnenoteListNotebooksOutputSchema: OutputSchema = {
  fields: [
    { key: 'value', label: 'Notebooks', labelKey: 'displayName', listItems: notebookFields },
  ],
};

export const microsoftOnenoteGetRecentNotebooksOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Recent Notebooks',
      labelKey: 'displayName',
      listItems: [
        { key: 'displayName', label: 'Name' },
        { key: 'lastAccessedTime', label: 'Last Opened At', format: 'datetime' },
        { key: 'sourceService', label: 'Source Service' },
        { key: 'links', label: 'Links', children: linkFields },
      ],
    },
  ],
};

export const microsoftOnenoteGetPageContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'pageId', label: 'Page ID' },
    { key: 'content', label: 'Content', format: 'html' },
  ],
};

export const microsoftOnenoteGetPageOutputSchema: OutputSchema = {
  fields: [
    ...pageFields,
    parentNotebookField,
    { key: 'parentSection', label: 'Parent Section', children: sectionFields },
  ],
};

export const microsoftOnenoteListPagesOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Pages',
      labelKey: 'title',
      listItems: [
        ...pageFields,
        { key: 'parentSection', label: 'Parent Section', children: parentRefFields },
      ],
    },
  ],
};

export const microsoftOnenoteGetPagePreviewOutputSchema: OutputSchema = {
  fields: [
    { key: 'previewText', label: 'Preview Text' },
    {
      key: 'links',
      label: 'Links',
      children: [{ key: 'previewImageUrl', label: 'Preview Image URL' }],
    },
  ],
};

export const microsoftOnenoteUpdatePageContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'pageId', label: 'Page ID' },
    { key: 'appliedChanges', label: 'Changes Applied', format: 'number' },
  ],
};

export const microsoftOnenoteGetResourceContentOutputSchema: OutputSchema = {
  fields: [
    { key: 'resourceId', label: 'Resource ID' },
    { key: 'fileName', label: 'File Name' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'file', label: 'File', format: 'url' },
  ],
};

export const microsoftOnenoteCreateSectionOutputSchema: OutputSchema = {
  fields: [...sectionFields, { key: 'links', label: 'Links', children: linkFields }],
};

export const createSectionOutputSchema: OutputSchema = {
  fields: [...sectionFields, { key: 'links', label: 'Links', children: linkFields }],
};

export const microsoftOnenoteGetSectionOutputSchema: OutputSchema = {
  fields: [...sectionFields, parentNotebookField, parentSectionGroupField],
};

export const microsoftOnenoteListSectionsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Sections',
      labelKey: 'displayName',
      listItems: [
        ...sectionFields,
        { key: 'parentNotebook', label: 'Parent Notebook', children: parentRefFields },
        { key: 'parentSectionGroup', label: 'Parent Section Group', children: parentRefFields },
      ],
    },
  ],
};

export const microsoftOnenoteCreateSectionGroupOutputSchema: OutputSchema = {
  fields: sectionGroupFields,
};

export const microsoftOnenoteGetSectionGroupOutputSchema: OutputSchema = {
  fields: [...sectionGroupFields, parentNotebookField, parentSectionGroupField],
};

export const microsoftOnenoteListSectionGroupsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'value',
      label: 'Section Groups',
      labelKey: 'displayName',
      listItems: [
        ...sectionGroupFields,
        { key: 'parentNotebook', label: 'Parent Notebook', children: parentRefFields },
        { key: 'parentSectionGroup', label: 'Parent Section Group', children: parentRefFields },
      ],
    },
  ],
};

export const newNoteInSectionOutputSchema: OutputSchema = {
  fields: [
    ...pageFields,
    { key: 'parentSection', label: 'Parent Section', children: parentRefFields },
    { key: 'content', label: 'Content', format: 'html' },
  ],
};
