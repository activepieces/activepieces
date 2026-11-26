import {
  OutputSchema,
  OutputSchemaField,
} from '@activepieces/pieces-framework';

export const chaindeskOutputSchemas: Record<
  | 'queryAgent'
  | 'queryDatastore'
  | 'datasource'
  | 'listAgents'
  | 'listDatastores'
  | 'listConversations'
  | 'conversationMessages',
  OutputSchema
> = {
  queryAgent: {
    fields: [
      { key: 'answer', label: 'Answer' },
      { key: 'conversationId', label: 'Conversation ID' },
      { key: 'messageId', label: 'Message ID' },
      { key: 'visitorId', label: 'Visitor ID' },
      {
        key: 'sources',
        label: 'Sources',
        labelKey: 'datasource_name',
        listItems: agentSourceFields(),
      },
      {
        key: 'usage',
        label: 'Usage',
        children: [
          { key: 'promptTokens', label: 'Prompt Tokens', format: 'number' },
          {
            key: 'completionTokens',
            label: 'Completion Tokens',
            format: 'number',
          },
          { key: 'totalTokens', label: 'Total Tokens', format: 'number' },
          { key: 'cost', label: 'Cost', format: 'number' },
        ],
      },
      { key: 'approvals', label: 'Approvals' },
    ],
  },
  queryDatastore: {
    itemLabel: '{datasource_name}',
    fields: datastoreResultFields(),
  },
  datasource: { fields: datasourceFields() },
  listAgents: {
    fields: [
      {
        key: 'agents',
        label: 'Agents',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Agent ID' },
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
          { key: 'modelName', label: 'Model' },
          { key: 'visibility', label: 'Visibility' },
          { key: 'createdAt', label: 'Created At', format: 'datetime' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  listDatastores: {
    fields: [
      {
        key: 'datastores',
        label: 'Datastores',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Datastore ID' },
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
          { key: 'type', label: 'Type' },
          { key: 'visibility', label: 'Visibility' },
          { key: 'config', label: 'Config' },
          { key: 'pluginName', label: 'Plugin Name' },
          { key: 'pluginDescriptionForHumans', label: 'Plugin Description' },
          {
            key: 'pluginDescriptionForModel',
            label: 'Plugin Description for Model',
          },
          { key: 'pluginIconUrl', label: 'Plugin Icon URL' },
          { key: '_count', label: 'Counts' },
          { key: 'organizationId', label: 'Organization ID' },
          { key: 'ownerId', label: 'Owner ID' },
          { key: 'createdAt', label: 'Created At', format: 'datetime' },
          { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  listConversations: {
    fields: [
      {
        key: 'conversations',
        label: 'Conversations',
        labelKey: 'title',
        listItems: [
          { key: 'id', label: 'Conversation ID' },
          { key: 'title', label: 'Title' },
          { key: 'agentId', label: 'Agent ID' },
          { key: 'channel', label: 'Channel' },
          {
            key: 'status',
            label: 'Status',
            description: 'UNRESOLVED, RESOLVED or HUMAN_REQUESTED.',
          },
          {
            key: 'priority',
            label: 'Priority',
            description: 'LOW, MEDIUM or HIGH.',
          },
          { key: 'visitorId', label: 'Visitor ID' },
          { key: 'userId', label: 'User ID' },
          { key: 'isAiEnabled', label: 'AI Enabled', format: 'boolean' },
          { key: 'metadata', label: 'Metadata' },
          { key: 'agent', label: 'Agent' },
          { key: 'messages', label: 'Latest Messages' },
          { key: 'formId', label: 'Form ID' },
          { key: 'mailInboxId', label: 'Mail Inbox ID' },
          { key: 'channelExternalId', label: 'Channel External ID' },
          { key: 'channelCredentialsId', label: 'Channel Credentials ID' },
          { key: 'organizationId', label: 'Organization ID' },
          { key: 'createdAt', label: 'Created At', format: 'datetime' },
          { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
      {
        key: 'next_cursor',
        label: 'Next Cursor',
        description:
          'Pass as Cursor to get the next page; empty when there are no more.',
      },
    ],
  },
  conversationMessages: {
    fields: [
      {
        key: 'messages',
        label: 'Messages',
        labelKey: 'from',
        listItems: [
          { key: 'id', label: 'Message ID' },
          { key: 'from', label: 'From', description: 'human or agent.' },
          { key: 'text', label: 'Text' },
          { key: 'read', label: 'Read', format: 'boolean' },
          { key: 'eval', label: 'Evaluation' },
          { key: 'html', label: 'HTML' },
          { key: 'agentId', label: 'Agent ID' },
          { key: 'sources', label: 'Sources' },
          { key: 'usage', label: 'Usage' },
          { key: 'createdAt', label: 'Created At', format: 'datetime' },
          { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
        ],
      },
      { key: 'count', label: 'Count', format: 'number' },
      {
        key: 'next_cursor',
        label: 'Next Cursor',
        description:
          'Pass as Cursor to get the next page; empty when there are no more.',
      },
    ],
  },
};

function datasourceFields(): OutputSchemaField[] {
  return [
    { key: 'id', label: 'Datasource ID' },
    {
      key: 'type',
      label: 'Type',
      description: 'For example file, text, web_page, web_site.',
    },
    { key: 'name', label: 'Name' },
    {
      key: 'status',
      label: 'Status',
      description:
        'unsynched, pending, running, synched, error or usage_limit_reached.',
    },
    { key: 'datastoreId', label: 'Datastore ID' },
    { key: 'groupId', label: 'Group ID' },
    { key: 'config', label: 'Config' },
    { key: 'createdAt', label: 'Created At', format: 'datetime' },
    { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
    { key: 'lastSynch', label: 'Last Synced At', format: 'datetime' },
    { key: 'nbChunks', label: 'Chunks', format: 'number' },
    { key: 'nbTokens', label: 'Tokens', format: 'number' },
    { key: 'textSize', label: 'Text Size', format: 'number' },
    { key: 'nbSynch', label: 'Sync Count', format: 'number' },
    { key: 'hash', label: 'Content Hash' },
    { key: 'serviceProviderId', label: 'Service Provider ID' },
    { key: 'organizationId', label: 'Organization ID' },
    { key: 'ownerId', label: 'Owner ID' },
    { key: 'datastore', label: 'Datastore' },
    { key: 'organization', label: 'Organization' },
    { key: 'children', label: 'Child Datasources' },
  ];
}

function datastoreResultFields(): OutputSchemaField[] {
  return [
    { key: 'text', label: 'Text' },
    { key: 'score', label: 'Score', format: 'number' },
    { key: 'source', label: 'Source' },
    { key: 'datasource_id', label: 'Datasource ID' },
    { key: 'datasource_name', label: 'Datasource Name' },
    { key: 'offset', label: 'Offset', format: 'number' },
  ];
}

function agentSourceFields(): OutputSchemaField[] {
  return [
    { key: 'datasource_id', label: 'Datasource ID' },
    { key: 'datasource_name', label: 'Datasource Name' },
    { key: 'datasource_type', label: 'Datasource Type' },
    { key: 'score', label: 'Score', format: 'number' },
    { key: 'source', label: 'Source URL' },
    { key: 'chunk_id', label: 'Chunk ID' },
    { key: 'mime_type', label: 'MIME Type' },
  ];
}
