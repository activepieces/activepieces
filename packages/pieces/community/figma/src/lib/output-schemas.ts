import { FieldFormat, OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function field({ key, label, format, value }: { key: string; label: string; format?: FieldFormat; value?: string }): OutputSchemaField {
  return { key, label, ...(format ? { format } : {}), ...(value !== undefined ? { value } : {}) };
}

const userFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'User ID' }),
  field({ key: 'handle', label: 'Name' }),
  field({ key: 'img_url', label: 'Avatar', format: 'image' }),
];

const commentFields: OutputSchemaField[] = [
  field({ key: 'id', label: 'Comment ID' }),
  field({ key: 'message', label: 'Message' }),
  field({ key: 'file_key', label: 'File Key' }),
  field({ key: 'parent_id', label: 'Parent Comment ID' }),
  field({ key: 'order_id', label: 'Comment Number' }),
  field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
  field({ key: 'resolved_at', label: 'Resolved At', format: 'datetime' }),
  { key: 'user', label: 'Author', children: userFields },
  { key: 'client_meta', label: 'Position', children: [field({ key: 'node_id', label: 'Node ID' }), field({ key: 'x', label: 'X', format: 'number' }), field({ key: 'y', label: 'Y', format: 'number' })] },
  { key: 'reactions', label: 'Reactions', labelKey: 'emoji', listItems: [field({ key: 'emoji', label: 'Emoji' }), field({ key: 'created_at', label: 'Created At', format: 'datetime' }), { key: 'user', label: 'User', children: userFields }] },
];

const fileSummaryFields: OutputSchemaField[] = [
  field({ key: 'name', label: 'File Name' }),
  field({ key: 'lastModified', label: 'Last Modified', format: 'datetime' }),
  field({ key: 'version', label: 'Version ID' }),
  field({ key: 'editorType', label: 'Editor Type' }),
  field({ key: 'role', label: 'Your Role' }),
  field({ key: 'thumbnailUrl', label: 'Thumbnail', format: 'image' }),
];

const getFile: OutputSchema = {
  fields: [
    field({ key: 'success', label: 'Success', format: 'boolean' }),
    {
      key: 'response_body',
      label: 'File',
      children: [
        ...fileSummaryFields,
        field({ key: 'mainFileKey', label: 'Main File Key' }),
        { key: 'document', label: 'Document', children: [field({ key: 'id', label: 'Document ID' }), field({ key: 'name', label: 'Document Name' }), { key: 'children', label: 'Pages', labelKey: 'name', listItems: [field({ key: 'id', label: 'Page ID' }), field({ key: 'name', label: 'Page Name' }), field({ key: 'type', label: 'Type' })] }] },
        { key: 'components', label: 'Components', dynamicKey: true, labelKey: 'name', children: [field({ key: 'key', label: 'Component Key' }), field({ key: 'name', label: 'Name' }), field({ key: 'description', label: 'Description' })] },
        { key: 'styles', label: 'Styles', dynamicKey: true, labelKey: 'name', children: [field({ key: 'key', label: 'Style Key' }), field({ key: 'name', label: 'Name' }), field({ key: 'styleType', label: 'Style Type' })] },
      ],
    },
  ],
};

const outlineNode: OutputSchemaField[] = [field({ key: 'id', label: 'Node ID' }), field({ key: 'name', label: 'Name' }), field({ key: 'type', label: 'Type' })];

const getFileOutline: OutputSchema = {
  fields: [
    field({ key: 'fileKey', label: 'File Key' }),
    ...fileSummaryFields.filter((entry) => entry.key !== 'role'),
    { key: 'pages', label: 'Pages', labelKey: 'name', listItems: [...outlineNode, { key: 'children', label: 'Layers', labelKey: 'name', listItems: [...outlineNode, { key: 'children', label: 'Child Layers', labelKey: 'name', listItems: outlineNode }] }] },
  ],
};

const getFileMetadata: OutputSchema = {
  fields: [
    field({ key: 'fileKey', label: 'File Key' }),
    field({ key: 'name', label: 'File Name' }),
    field({ key: 'folder_name', label: 'Project Name' }),
    field({ key: 'last_touched_at', label: 'Last Edited At', format: 'datetime' }),
    field({ key: 'editorType', label: 'Editor Type' }),
    field({ key: 'version', label: 'Version ID' }),
    field({ key: 'role', label: 'Your Role' }),
    field({ key: 'link_access', label: 'Link Access' }),
    field({ key: 'url', label: 'File URL', format: 'url' }),
    field({ key: 'thumbnail_url', label: 'Thumbnail', format: 'image' }),
    { key: 'creator', label: 'Creator', children: userFields },
    { key: 'last_touched_by', label: 'Last Edited By', children: userFields },
  ],
};

const getFileNodes: OutputSchema = {
  fields: [
    field({ key: 'fileKey', label: 'File Key' }),
    field({ key: 'name', label: 'File Name' }),
    field({ key: 'lastModified', label: 'Last Modified', format: 'datetime' }),
    field({ key: 'version', label: 'Version ID' }),
    {
      key: 'nodes',
      label: 'Nodes',
      labelKey: 'nodeId',
      listItems: [
        field({ key: 'nodeId', label: 'Node ID' }),
        field({ key: 'found', label: 'Found', format: 'boolean' }),
        field({ key: 'name', label: 'Name', value: 'document.name' }),
        field({ key: 'type', label: 'Type', value: 'document.type' }),
        field({ key: 'document', label: 'Node Tree' }),
      ],
    },
  ],
};

const exportImages: OutputSchema = {
  fields: [
    field({ key: 'fileKey', label: 'File Key' }),
    field({ key: 'format', label: 'Format' }),
    field({ key: 'scale', label: 'Scale', format: 'number' }),
    {
      key: 'images',
      label: 'Images',
      labelKey: 'nodeId',
      listItems: [
        field({ key: 'nodeId', label: 'Node ID' }),
        field({ key: 'url', label: 'Image URL (valid 30 days)', format: 'url' }),
        field({ key: 'error', label: 'Error' }),
        field({ key: 'file', label: 'Downloaded File' }),
        field({ key: 'size', label: 'File Size', format: 'filesize' }),
      ],
    },
  ],
};

const listVersions: OutputSchema = {
  fields: [
    {
      key: 'items',
      label: 'Versions',
      labelKey: 'label',
      listItems: [
        field({ key: 'id', label: 'Version ID' }),
        field({ key: 'label', label: 'Label' }),
        field({ key: 'description', label: 'Description' }),
        field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
        field({ key: 'thumbnail_url', label: 'Thumbnail', format: 'image' }),
        { key: 'user', label: 'Created By', children: userFields },
      ],
    },
    field({ key: 'nextCursor', label: 'Next Cursor' }),
    field({ key: 'hasMore', label: 'Has More', format: 'boolean' }),
  ],
};

const getComments: OutputSchema = {
  fields: [
    field({ key: 'success', label: 'Success', format: 'boolean' }),
    { key: 'response_body', label: 'Response', children: [{ key: 'comments', label: 'Comments', labelKey: 'message', listItems: commentFields }] },
  ],
};

const postComment: OutputSchema = {
  fields: [
    field({ key: 'success', label: 'Success', format: 'boolean' }),
    { key: 'response_body', label: 'Comment', children: commentFields },
  ],
};

const deleteComment: OutputSchema = {
  fields: [field({ key: 'deleted', label: 'Deleted', format: 'boolean' }), field({ key: 'fileKey', label: 'File Key' }), field({ key: 'commentId', label: 'Comment ID' })],
};

const listReactions: OutputSchema = {
  fields: [
    { key: 'items', label: 'Reactions', labelKey: 'emoji', listItems: [field({ key: 'emoji', label: 'Emoji' }), field({ key: 'created_at', label: 'Created At', format: 'datetime' }), { key: 'user', label: 'User', children: userFields }] },
    field({ key: 'nextCursor', label: 'Next Cursor' }),
    field({ key: 'hasMore', label: 'Has More', format: 'boolean' }),
  ],
};

const reactionChange = ({ key, label }: { key: 'added' | 'removed'; label: string }): OutputSchema => ({
  fields: [field({ key, label, format: 'boolean' }), field({ key: 'fileKey', label: 'File Key' }), field({ key: 'commentId', label: 'Comment ID' }), field({ key: 'emoji', label: 'Emoji' })],
});

const libraryItemFields: OutputSchemaField[] = [
  field({ key: 'key', label: 'Key' }),
  field({ key: 'name', label: 'Name' }),
  field({ key: 'description', label: 'Description' }),
  field({ key: 'node_id', label: 'Node ID' }),
  field({ key: 'thumbnail_url', label: 'Thumbnail', format: 'image' }),
  field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
  field({ key: 'updated_at', label: 'Updated At', format: 'datetime' }),
  { key: 'user', label: 'Last Published By', children: userFields },
];

const listComponents: OutputSchema = {
  fields: [
    field({ key: 'fileKey', label: 'File Key' }),
    { key: 'items', label: 'Components', labelKey: 'name', listItems: [...libraryItemFields, { key: 'containing_frame', label: 'Containing Frame', children: [field({ key: 'name', label: 'Frame Name' }), field({ key: 'nodeId', label: 'Frame Node ID' }), field({ key: 'pageName', label: 'Page Name' })] }] },
    field({ key: 'count', label: 'Count', format: 'number' }),
  ],
};

const listStyles: OutputSchema = {
  fields: [
    field({ key: 'fileKey', label: 'File Key' }),
    { key: 'items', label: 'Styles', labelKey: 'name', listItems: [...libraryItemFields, field({ key: 'style_type', label: 'Style Type' })] },
    field({ key: 'count', label: 'Count', format: 'number' }),
  ],
};

const currentUser: OutputSchema = {
  fields: [field({ key: 'id', label: 'User ID' }), field({ key: 'handle', label: 'Name' }), field({ key: 'email', label: 'Email', format: 'email' }), field({ key: 'img_url', label: 'Avatar', format: 'image' })],
};

const eventBase: OutputSchemaField[] = [
  field({ key: 'event_type', label: 'Event Type' }),
  field({ key: 'file_key', label: 'File Key' }),
  field({ key: 'file_name', label: 'File Name' }),
  field({ key: 'timestamp', label: 'Event Time', format: 'datetime' }),
  field({ key: 'webhook_id', label: 'Webhook ID' }),
];

const triggeredBy: OutputSchemaField = { key: 'triggered_by', label: 'Triggered By', children: [field({ key: 'id', label: 'User ID' }), field({ key: 'handle', label: 'Name' })] };

const newComment: OutputSchema = {
  fields: [
    ...eventBase,
    field({ key: 'comment_id', label: 'Comment ID' }),
    field({ key: 'parent_id', label: 'Parent Comment ID' }),
    field({ key: 'order_id', label: 'Comment Number' }),
    field({ key: 'created_at', label: 'Created At', format: 'datetime' }),
    field({ key: 'resolved_at', label: 'Resolved At', format: 'datetime' }),
    { key: 'comment', label: 'Comment Parts', listItems: [field({ key: 'text', label: 'Text' }), field({ key: 'mention', label: 'Mentioned User ID' })] },
    { key: 'mentions', label: 'Mentions', labelKey: 'handle', listItems: [field({ key: 'id', label: 'User ID' }), field({ key: 'handle', label: 'Name' })] },
    triggeredBy,
  ],
};

const newVersion: OutputSchema = {
  fields: [...eventBase, field({ key: 'version_id', label: 'Version ID' }), field({ key: 'label', label: 'Label' }), field({ key: 'description', label: 'Description' }), field({ key: 'created_at', label: 'Created At', format: 'datetime' }), triggeredBy],
};

const fileUpdated: OutputSchema = { fields: eventBase };

const fileDeleted: OutputSchema = { fields: [...eventBase, triggeredBy] };

const publishedItem: OutputSchemaField[] = [field({ key: 'key', label: 'Key' }), field({ key: 'name', label: 'Name' })];

const libraryPublished: OutputSchema = {
  fields: [
    ...eventBase,
    field({ key: 'description', label: 'Publish Description' }),
    field({ key: 'created_at', label: 'Published At', format: 'datetime' }),
    { key: 'created_components', label: 'Created Components', labelKey: 'name', listItems: publishedItem },
    { key: 'modified_components', label: 'Modified Components', labelKey: 'name', listItems: publishedItem },
    { key: 'deleted_components', label: 'Deleted Components', labelKey: 'name', listItems: publishedItem },
    { key: 'created_styles', label: 'Created Styles', labelKey: 'name', listItems: publishedItem },
    { key: 'modified_styles', label: 'Modified Styles', labelKey: 'name', listItems: publishedItem },
    { key: 'deleted_styles', label: 'Deleted Styles', labelKey: 'name', listItems: publishedItem },
    { key: 'created_variables', label: 'Created Variables', labelKey: 'name', listItems: publishedItem },
    { key: 'modified_variables', label: 'Modified Variables', labelKey: 'name', listItems: publishedItem },
    { key: 'deleted_variables', label: 'Deleted Variables', labelKey: 'name', listItems: publishedItem },
    triggeredBy,
  ],
};

export const figmaOutputSchemas = {
  getFile,
  getFileOutline,
  getFileMetadata,
  getFileNodes,
  exportImages,
  listVersions,
  getComments,
  postComment,
  deleteComment,
  listReactions,
  addReaction: reactionChange({ key: 'added', label: 'Added' }),
  removeReaction: reactionChange({ key: 'removed', label: 'Removed' }),
  listComponents,
  listStyles,
  currentUser,
  newComment,
  newVersion,
  fileUpdated,
  fileDeleted,
  libraryPublished,
};
