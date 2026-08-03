import { OutputSchema } from '@activepieces/pieces-framework';

const codyFolderFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Folder ID' },
  { key: 'name', label: 'Name' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const codyBotFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Bot ID' },
  { key: 'name', label: 'Name' },
  { key: 'description', label: 'Description' },
  { key: 'model', label: 'Model' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const codyConversationFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Conversation ID' },
  { key: 'name', label: 'Name' },
  { key: 'bot_id', label: 'Bot ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const codyMessageFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Message ID' },
  { key: 'content', label: 'Content' },
  { key: 'conversation_id', label: 'Conversation ID' },
  { key: 'machine', label: 'Machine (Bot Reply)', format: 'boolean' },
  { key: 'failed_responding', label: 'Failed Responding', format: 'boolean' },
  { key: 'flagged', label: 'Flagged', format: 'boolean' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const codyDocumentFields: OutputSchema['fields'] = [
  { key: 'id', label: 'Document ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status' },
  { key: 'content_url', label: 'Content URL', format: 'url' },
  { key: 'folder_id', label: 'Folder ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const codyPaginationFields: OutputSchema['fields'] = [
  { key: 'total', label: 'Total', format: 'number' },
  { key: 'count', label: 'Count', format: 'number' },
  { key: 'per_page', label: 'Per Page', format: 'number' },
  { key: 'current_page', label: 'Current Page', format: 'number' },
  { key: 'total_pages', label: 'Total Pages', format: 'number' },
];

const codyMetaField: OutputSchema['fields'][number] = {
  key: 'meta',
  label: 'Meta',
  children: [{ key: 'pagination', label: 'Pagination', children: codyPaginationFields }],
};

export const listBotsOutputSchema: OutputSchema = {
  fields: [
    { key: 'bots', label: 'Bots', labelKey: 'name', listItems: codyBotFields },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const listFoldersOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Folders', labelKey: 'name', listItems: codyFolderFields },
    codyMetaField,
  ],
};

export const createFolderOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Folder', children: codyFolderFields }],
};

export const getFolderOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Folder', children: codyFolderFields }],
};

export const renameFolderOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Folder', children: codyFolderFields }],
};

export const createTextDocumentOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Document', children: codyDocumentFields }],
};

export const createDocumentFromWebpageOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Document', children: codyDocumentFields }],
};

export const getDocumentOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Document', children: codyDocumentFields }],
};

export const listDocumentsOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Documents', labelKey: 'name', listItems: codyDocumentFields },
    codyMetaField,
  ],
};

export const deleteDocumentOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'document_id', label: 'Document ID' },
  ],
};

export const uploadFileToKbOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
  ],
};

export const createConversationAiOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Conversation', children: codyConversationFields }],
};

export const updateConversationOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Conversation', children: codyConversationFields }],
};

export const getConversationOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Conversation',
      children: [
        ...codyConversationFields,
        {
          key: 'document_ids',
          label: 'Document IDs (Focus Mode)',
          description: 'Present only when requested via the Includes parameter.',
          children: [{ key: 'data', label: 'IDs' }],
        },
      ],
    },
  ],
};

export const listConversationsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'conversations',
      label: 'Conversations',
      labelKey: 'name',
      listItems: codyConversationFields,
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const deleteConversationOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'conversation_id', label: 'Conversation ID' },
  ],
};

export const sendMessageAiOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Message', children: codyMessageFields }],
};

export const getMessageOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'data',
      label: 'Message',
      children: [
        ...codyMessageFields,
        {
          key: 'sources',
          label: 'Sources',
          description: 'Present only when requested via the Includes parameter (value "sources").',
          children: [{ key: 'data', label: 'Source Documents' }],
        },
        {
          key: 'usage',
          label: 'Usage',
          description: 'Present only when requested via the Includes parameter (value "usage").',
          children: [
            { key: 'tokens', label: 'Tokens', format: 'number' },
            { key: 'credits', label: 'Credits', format: 'number' },
          ],
        },
      ],
    },
  ],
};

export const listMessagesOutputSchema: OutputSchema = {
  fields: [
    { key: 'data', label: 'Messages', listItems: codyMessageFields },
    codyMetaField,
  ],
};

export const createConversationOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Conversation', children: codyConversationFields }],
};

export const createDocumentFromTextOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Document', children: codyDocumentFields }],
};

export const sendMessageOutputSchema: OutputSchema = {
  fields: [{ key: 'data', label: 'Message', children: codyMessageFields }],
};

export const uploadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'message', label: 'Message' },
  ],
};

export const findBotOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    { key: 'bots', label: 'Bots', labelKey: 'name', listItems: codyBotFields },
  ],
};

export const findConversationOutputSchema: OutputSchema = {
  fields: [
    { key: 'found', label: 'Found', format: 'boolean' },
    {
      key: 'conversations',
      label: 'Conversations',
      labelKey: 'name',
      listItems: codyConversationFields,
    },
  ],
};
