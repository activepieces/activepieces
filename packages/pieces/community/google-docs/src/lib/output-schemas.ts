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

export const insertTextActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'insertedCharacters', label: 'Inserted Characters', format: 'number' },
    { key: 'mode', label: 'Mode' },
  ],
};

export const deleteContentRangeActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'deletedFrom', label: 'Deleted From Index', format: 'number' },
    { key: 'deletedTo', label: 'Deleted To Index', format: 'number' },
  ],
};

export const replaceAllTextActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'documentId', label: 'Document ID' },
    { key: 'occurrencesChanged', label: 'Occurrences Changed', format: 'number' },
  ],
};

export const createParagraphBulletsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'startIndex', label: 'Start Index', format: 'number' },
    { key: 'endIndex', label: 'End Index', format: 'number' },
    { key: 'bulletPreset', label: 'Bullet Preset' },
  ],
};

export const deleteParagraphBulletsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'rangeStart', label: 'Range Start', format: 'number' },
    { key: 'rangeEnd', label: 'Range End', format: 'number' },
  ],
};

export const createFooterActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'footerId', label: 'Footer ID' },
  ],
};

export const createHeaderActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'headerId', label: 'Header ID' },
  ],
};

export const createFootnoteActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'footnoteId', label: 'Footnote ID' },
  ],
};

export const createNamedRangeActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'name', label: 'Range Name' },
    { key: 'namedRangeId', label: 'Named Range ID' },
  ],
};

export const deleteFooterActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'deletedFooterId', label: 'Deleted Footer ID' },
  ],
};

export const deleteHeaderActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'deletedHeaderId', label: 'Deleted Header ID' },
  ],
};

export const deleteNamedRangeActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'deletedNamedRangeId', label: 'Deleted Named Range ID' },
    { key: 'deletedName', label: 'Deleted Range Name' },
  ],
};

export const insertTableActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'rows', label: 'Rows', format: 'number' },
    { key: 'columns', label: 'Columns', format: 'number' },
    { key: 'mode', label: 'Mode' },
  ],
};

export const insertTableRowActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'tableStartIndex', label: 'Table Start Index', format: 'number' },
    { key: 'rowIndex', label: 'Row Index', format: 'number' },
    { key: 'columnIndex', label: 'Column Index', format: 'number' },
    { key: 'insertBelow', label: 'Inserted Below', format: 'boolean' },
  ],
};

export const insertTableColumnActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'tableStartIndex', label: 'Table Start Index', format: 'number' },
    { key: 'rowIndex', label: 'Row Index', format: 'number' },
    { key: 'columnIndex', label: 'Column Index', format: 'number' },
    { key: 'insertRight', label: 'Inserted to the Right', format: 'boolean' },
  ],
};

export const deleteTableRowActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'tableStartIndex', label: 'Table Start Index', format: 'number' },
    { key: 'deletedRowIndex', label: 'Deleted Row Index', format: 'number' },
  ],
};

export const deleteTableColumnActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'tableStartIndex', label: 'Table Start Index', format: 'number' },
    { key: 'deletedColumnIndex', label: 'Deleted Column Index', format: 'number' },
  ],
};

export const insertTextInTableCellActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'tableStartIndex', label: 'Table Start Index', format: 'number' },
    { key: 'rowIndex', label: 'Row Index', format: 'number' },
    { key: 'columnIndex', label: 'Column Index', format: 'number' },
    { key: 'insertedAtIndex', label: 'Inserted At Index', format: 'number' },
    { key: 'insertedCharacters', label: 'Inserted Characters', format: 'number' },
  ],
};

export const insertImageInTableCellActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'tableStartIndex', label: 'Table Start Index', format: 'number' },
    { key: 'rowIndex', label: 'Row Index', format: 'number' },
    { key: 'columnIndex', label: 'Column Index', format: 'number' },
    { key: 'insertedAtIndex', label: 'Inserted At Index', format: 'number' },
    { key: 'uri', label: 'Image URI', format: 'url' },
  ],
};

export const unmergeTableCellsActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'tableStartIndex', label: 'Table Start Index', format: 'number' },
    { key: 'rowIndex', label: 'Row Index', format: 'number' },
    { key: 'columnIndex', label: 'Column Index', format: 'number' },
    { key: 'rowSpan', label: 'Row Span', format: 'number' },
    { key: 'columnSpan', label: 'Column Span', format: 'number' },
  ],
};

export const updateTableRowStyleActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'tableStartIndex', label: 'Table Start Index', format: 'number' },
    { key: 'rowIndices', label: 'Row Indices' },
    { key: 'updatedFields', label: 'Updated Fields' },
  ],
};

export const updateDocumentStyleActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'updatedFields', label: 'Updated Fields' },
  ],
};

export const insertInlineImageActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'insertedObjectId', label: 'Inserted Object ID' },
    { key: 'mode', label: 'Mode' },
  ],
};

export const insertPageBreakActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'mode', label: 'Mode' },
  ],
};

export const replaceImageActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'imageObjectId', label: 'Image Object ID' },
  ],
};

export const getDocumentEndIndexActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'documentId', label: 'Document ID' },
    { key: 'title', label: 'Title' },
    { key: 'endIndex', label: 'End Index', format: 'number' },
    { key: 'maxInsertIndex', label: 'Max Insert Index', format: 'number' },
  ],
};

export const getDocumentPlaintextActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'documentId', label: 'Document ID' },
    { key: 'title', label: 'Title' },
    { key: 'plainText', label: 'Plain Text' },
  ],
};

export const copyDocumentActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'id', label: 'Document ID' },
    { key: 'name', label: 'Name' },
    { key: 'webViewLink', label: 'Web View Link', format: 'url' },
    { key: 'parents', label: 'Parent Folder IDs' },
  ],
};

export const searchDocumentsActionOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'documents',
      label: 'Documents',
      value: 'documents',
      labelKey: 'name',
      listItems: [
        { key: 'id', label: 'Document ID' },
        { key: 'name', label: 'Name' },
        { key: 'createdTime', label: 'Created Time', format: 'datetime' },
        { key: 'modifiedTime', label: 'Modified Time', format: 'datetime' },
        { key: 'webViewLink', label: 'Web View Link', format: 'url' },
        { key: 'ownerEmail', label: 'Owner Email', format: 'email' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
    { key: 'nextPageToken', label: 'Next Page Token' },
  ],
};

export const batchUpdateActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'appliedRequests', label: 'Applied Requests', format: 'number' },
    { key: 'replies', label: 'Replies' },
  ],
};

export const createAndPopulateTableActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'rows', label: 'Rows', format: 'number' },
    { key: 'columns', label: 'Columns', format: 'number' },
    { key: 'cellsPopulated', label: 'Cells Populated', format: 'number' },
  ],
};

export const replaceSectionWithMarkdownActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'replacedFrom', label: 'Replaced From Index', format: 'number' },
    { key: 'replacedTo', label: 'Replaced To Index', format: 'number' },
    { key: 'url', label: 'Document URL', format: 'url' },
  ],
};

export const replaceBodyWithMarkdownActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'url', label: 'Document URL', format: 'url' },
  ],
};

export const createDocumentFromMarkdownActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'title', label: 'Title' },
    { key: 'url', label: 'Document URL', format: 'url' },
  ],
};

export const exportAsPdfActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'documentId', label: 'Document ID' },
    { key: 'file', label: 'PDF File' },
  ],
};
