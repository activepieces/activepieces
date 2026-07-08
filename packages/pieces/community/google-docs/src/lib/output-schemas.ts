import { OutputSchema } from '@activepieces/pieces-framework';

const driveFileFields: OutputSchema['fields'] = [
  {
    key: 'id',
    label: 'Document ID',
    value: 'id',
  },
  {
    key: 'name',
    label: 'Name',
    value: 'name',
  },
  {
    key: 'mimeType',
    label: 'MIME Type',
    value: 'mimeType',
  },
  {
    key: 'webViewLink',
    label: 'Web View Link',
    value: 'webViewLink',
    format: 'url',
  },
  {
    key: 'iconLink',
    label: 'Icon',
    value: 'iconLink',
    format: 'image',
  },
  {
    key: 'thumbnailLink',
    label: 'Thumbnail',
    value: 'thumbnailLink',
    format: 'image',
  },
  {
    key: 'size',
    label: 'Size',
    value: 'size',
    format: 'filesize',
  },
  {
    key: 'createdTime',
    label: 'Created Time',
    value: 'createdTime',
    format: 'datetime',
  },
  {
    key: 'modifiedTime',
    label: 'Modified Time',
    value: 'modifiedTime',
    format: 'datetime',
  },
  {
    key: 'trashed',
    label: 'Trashed',
    value: 'trashed',
    format: 'boolean',
  },
  {
    key: 'shared',
    label: 'Shared',
    value: 'shared',
    format: 'boolean',
  },
  {
    key: 'starred',
    label: 'Starred',
    value: 'starred',
    format: 'boolean',
  },
  {
    key: 'parents',
    label: 'Parent Folder IDs',
    value: 'parents',
  },
  {
    key: 'owners',
    label: 'Owners',
    value: 'owners',
    labelKey: 'displayName',
    listItems: [
      {
        key: 'displayName',
        label: 'Name',
        value: 'displayName',
      },
      {
        key: 'emailAddress',
        label: 'Email',
        value: 'emailAddress',
        format: 'email',
      },
      {
        key: 'photoLink',
        label: 'Photo',
        value: 'photoLink',
        format: 'image',
      },
    ],
  },
  {
    key: 'lastModifyingUser',
    label: 'Last Modifying User',
    value: 'lastModifyingUser',
    children: [
      {
        key: 'displayName',
        label: 'Name',
        value: 'displayName',
      },
      {
        key: 'emailAddress',
        label: 'Email',
        value: 'emailAddress',
        format: 'email',
      },
      {
        key: 'photoLink',
        label: 'Photo',
        value: 'photoLink',
        format: 'image',
      },
    ],
  },
];

export const createDocumentActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'documentId',
      label: 'Document ID',
      value: 'documentId',
    },
    {
      key: 'requiredRevisionId',
      label: 'Revision ID',
      value: 'writeControl.requiredRevisionId',
    },
  ],
};

export const appendTextActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'documentId',
      label: 'Document ID',
      value: 'documentId',
    },
    {
      key: 'requiredRevisionId',
      label: 'Revision ID',
      value: 'writeControl.requiredRevisionId',
    },
  ],
};

export const editTemplateActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'documentId',
      label: 'Document ID',
      value: 'data.documentId',
    },
    {
      key: 'requiredRevisionId',
      label: 'Revision ID',
      value: 'data.writeControl.requiredRevisionId',
    },
    {
      key: 'status',
      label: 'Status Code',
      value: 'status',
      format: 'number',
    },
    {
      key: 'statusText',
      label: 'Status Text',
      value: 'statusText',
    },
  ],
};

export const readDocumentActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'title',
      label: 'Title',
      value: 'title',
    },
    {
      key: 'documentId',
      label: 'Document ID',
      value: 'documentId',
    },
    {
      key: 'revisionId',
      label: 'Revision ID',
      value: 'revisionId',
    },
    {
      key: 'suggestionsViewMode',
      label: 'Suggestions View Mode',
      value: 'suggestionsViewMode',
    },
    {
      key: 'content',
      label: 'Body Content',
      value: 'body.content',
      listItems: [
        {
          key: 'startIndex',
          label: 'Start Index',
          value: 'startIndex',
          format: 'number',
        },
        {
          key: 'endIndex',
          label: 'End Index',
          value: 'endIndex',
          format: 'number',
        },
        {
          key: 'elements',
          label: 'Paragraph Text',
          value: 'paragraph.elements',
          labelKey: 'textRun.content',
          listItems: [
            {
              key: 'text',
              label: 'Text',
              value: 'textRun.content',
            },
          ],
        },
      ],
    },
  ],
};

export const findDocumentActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'found',
      label: 'Found',
      value: 'found',
      format: 'boolean',
    },
    {
      key: 'file',
      label: 'Document',
      value: 'file',
      children: driveFileFields,
    },
  ],
};

export const newDocumentTriggerOutputSchema: OutputSchema = {
  fields: driveFileFields,
};
