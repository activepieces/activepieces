import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function listOf({ label, itemFields, labelKey }: { label: string; itemFields: OutputSchemaField[]; labelKey: string }): OutputSchema {
  return {
    fields: [
      { key: 'items', label, labelKey, listItems: itemFields },
      { key: 'count', label: 'Returned Count', format: 'number' },
      { key: 'has_more', label: 'May Have More', format: 'boolean', description: 'True when a full page came back, so another page may exist.' },
      { key: 'next_cursor', label: 'Next Cursor', description: 'Pass as After (Cursor) to fetch the next page.' },
    ],
  };
}

const agentSummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Agent ID' },
  { key: 'name', label: 'Name' },
  { key: 'agent_type', label: 'Agent Type' },
  { key: 'model', label: 'Model' },
  { key: 'embedding', label: 'Embedding Model' },
  { key: 'description', label: 'Description' },
  { key: 'tags', label: 'Tags' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'last_run_completion', label: 'Last Run Completed At', format: 'datetime' },
  { key: 'last_stop_reason', label: 'Last Stop Reason' },
];

const toolRefFields: OutputSchemaField[] = [
  { key: 'id', label: 'Tool ID' },
  { key: 'name', label: 'Name' },
  { key: 'tool_type', label: 'Tool Type' },
];

const toolFields: OutputSchemaField[] = [
  ...toolRefFields,
  { key: 'description', label: 'Description' },
  { key: 'tags', label: 'Tags' },
];

const blockFields: OutputSchemaField[] = [
  { key: 'id', label: 'Block ID' },
  { key: 'label', label: 'Label' },
  { key: 'value', label: 'Value' },
  { key: 'limit', label: 'Character Limit', format: 'number' },
  { key: 'description', label: 'Description' },
  { key: 'read_only', label: 'Read Only', format: 'boolean' },
];

const agentFields: OutputSchemaField[] = [
  ...agentSummaryFields,
  { key: 'system', label: 'System Prompt' },
  {
    key: 'blocks',
    label: 'Memory Blocks',
    labelKey: 'label',
    listItems: [
      { key: 'id', label: 'Block ID' },
      { key: 'label', label: 'Label' },
      { key: 'value', label: 'Value' },
      { key: 'limit', label: 'Character Limit', format: 'number' },
      { key: 'description', label: 'Description' },
    ],
  },
  { key: 'tools', label: 'Tools', labelKey: 'name', listItems: toolRefFields },
  { key: 'identity_ids', label: 'Identity IDs' },
];

const messageFields: OutputSchemaField[] = [
  { key: 'id', label: 'Message ID' },
  { key: 'message_type', label: 'Message Type' },
  { key: 'date', label: 'Date', format: 'datetime' },
  { key: 'text', label: 'Text' },
  { key: 'tool_name', label: 'Tool Name' },
  { key: 'tool_arguments', label: 'Tool Arguments' },
  { key: 'tool_status', label: 'Tool Status' },
  { key: 'run_id', label: 'Run ID' },
  { key: 'step_id', label: 'Step ID' },
];

const identityFields: OutputSchemaField[] = [
  { key: 'id', label: 'Identity ID' },
  { key: 'identifier_key', label: 'Identifier Key' },
  { key: 'name', label: 'Name' },
  { key: 'identity_type', label: 'Identity Type' },
  { key: 'project_id', label: 'Project ID' },
  { key: 'agent_ids', label: 'Agent IDs' },
  { key: 'block_ids', label: 'Block IDs' },
  {
    key: 'properties',
    label: 'Properties',
    labelKey: 'key',
    listItems: [
      { key: 'key', label: 'Key' },
      { key: 'type', label: 'Type' },
      { key: 'value', label: 'Value' },
    ],
  },
];

const runFields: OutputSchemaField[] = [
  { key: 'id', label: 'Run ID' },
  { key: 'agent_id', label: 'Agent ID' },
  { key: 'status', label: 'Status' },
  { key: 'stop_reason', label: 'Stop Reason' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'completed_at', label: 'Completed At', format: 'datetime' },
  { key: 'total_duration_ns', label: 'Total Duration (ns)', format: 'number' },
];

const passageFields: OutputSchemaField[] = [
  { key: 'id', label: 'Memory ID' },
  { key: 'text', label: 'Text' },
  { key: 'tags', label: 'Tags' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
];

const usageFields: OutputSchemaField[] = [
  { key: 'prompt_tokens', label: 'Prompt Tokens', format: 'number' },
  { key: 'completion_tokens', label: 'Completion Tokens', format: 'number' },
  { key: 'total_tokens', label: 'Total Tokens', format: 'number' },
  { key: 'step_count', label: 'Step Count', format: 'number' },
  { key: 'context_tokens', label: 'Context Tokens', format: 'number' },
  { key: 'cached_input_tokens', label: 'Cached Input Tokens', format: 'number' },
  { key: 'cache_write_tokens', label: 'Cache Write Tokens', format: 'number' },
  { key: 'reasoning_tokens', label: 'Reasoning Tokens', format: 'number' },
  { key: 'run_ids', label: 'Run IDs' },
  { key: 'message_type', label: 'Usage Record Type' },
];

const rawMessageFields: OutputSchemaField[] = [
  { key: 'id', label: 'Message ID' },
  { key: 'message_type', label: 'Message Type' },
  { key: 'date', label: 'Date', format: 'datetime' },
  { key: 'otid', label: 'Offline Threading ID' },
  { key: 'name', label: 'Name' },
  { key: 'sender_id', label: 'Sender ID' },
  { key: 'seq_id', label: 'Sequence ID', format: 'number' },
  { key: 'is_err', label: 'Is Error', format: 'boolean' },
  { key: 'content', label: 'Content' },
  { key: 'reasoning', label: 'Reasoning' },
  { key: 'source', label: 'Reasoning Source' },
  { key: 'signature', label: 'Reasoning Signature' },
  { key: 'tool_call', label: 'Tool Call', children: [
    { key: 'name', label: 'Tool Name' },
    { key: 'arguments', label: 'Arguments' },
    { key: 'tool_call_id', label: 'Tool Call ID' },
  ] },
  { key: 'tool_return', label: 'Tool Return' },
  { key: 'run_id', label: 'Run ID' },
  { key: 'step_id', label: 'Step ID' },
];

export const lettaSchemas = {
  agent: { fields: agentFields },
  agentList: listOf({ label: 'Agents', itemFields: agentSummaryFields, labelKey: 'name' }),
  deletedAgent: {
    fields: [
      { key: 'agent_id', label: 'Agent ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
    ],
  },
  sendMessage: {
    fields: [
      { key: 'assistant_text', label: 'Assistant Reply', description: 'All assistant_message text joined, or empty when the agent did not reply.' },
      { key: 'messages', label: 'Messages', labelKey: 'message_type', listItems: messageFields },
      { key: 'stop_reason', label: 'Stop Reason' },
      { key: 'usage', label: 'Usage', children: usageFields },
    ],
  },
  run: { fields: runFields },
  messageList: listOf({ label: 'Messages', itemFields: messageFields, labelKey: 'message_type' }),
  resetMessages: {
    fields: [
      { key: 'agent_id', label: 'Agent ID' },
      { key: 'reset', label: 'Reset', format: 'boolean' },
    ],
  },
  block: { fields: blockFields },
  blockList: listOf({ label: 'Blocks', itemFields: blockFields, labelKey: 'label' }),
  deletedBlock: {
    fields: [
      { key: 'block_id', label: 'Block ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
    ],
  },
  agentBlockLink: {
    fields: [
      { key: 'agent_id', label: 'Agent ID' },
      { key: 'block_id', label: 'Block ID' },
      { key: 'blocks', label: 'Agent Memory Blocks', labelKey: 'label', listItems: [
        { key: 'id', label: 'Block ID' },
        { key: 'label', label: 'Label' },
      ] },
    ],
  },
  detachBlock: {
    fields: [
      { key: 'agent_id', label: 'Agent ID' },
      { key: 'block_id', label: 'Block ID' },
      { key: 'detached', label: 'Detached', format: 'boolean' },
      { key: 'already_detached', label: 'Was Already Detached', format: 'boolean' },
      { key: 'blocks', label: 'Agent Memory Blocks', labelKey: 'label', listItems: [
        { key: 'id', label: 'Block ID' },
        { key: 'label', label: 'Label' },
      ] },
    ],
  },
  passageList: listOf({ label: 'Memories', itemFields: passageFields, labelKey: 'text' }),
  insertedPassages: {
    fields: [
      { key: 'items', label: 'Inserted Memories', labelKey: 'text', listItems: passageFields },
      { key: 'count', label: 'Inserted Count', format: 'number' },
    ],
  },
  deletedPassage: {
    fields: [
      { key: 'agent_id', label: 'Agent ID' },
      { key: 'memory_id', label: 'Memory ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
    ],
  },
  toolList: listOf({ label: 'Tools', itemFields: toolFields, labelKey: 'name' }),
  agentToolLink: {
    fields: [
      { key: 'agent_id', label: 'Agent ID' },
      { key: 'tool_id', label: 'Tool ID' },
      { key: 'tools', label: 'Agent Tools', labelKey: 'name', listItems: toolRefFields },
    ],
  },
  modelList: {
    fields: [
      { key: 'items', label: 'Models', labelKey: 'handle', listItems: [
        { key: 'handle', label: 'Handle', description: 'Use this value as the model or embedding when creating an agent.' },
        { key: 'name', label: 'Name' },
        { key: 'display_name', label: 'Display Name' },
        { key: 'kind', label: 'Kind' },
        { key: 'provider_type', label: 'Provider Type' },
        { key: 'context_window', label: 'Context Window', format: 'number' },
        { key: 'embedding_dim', label: 'Embedding Dimensions', format: 'number' },
      ] },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  tagList: {
    fields: [
      { key: 'items', label: 'Tags' },
      { key: 'count', label: 'Returned Count', format: 'number' },
      { key: 'has_more', label: 'May Have More', format: 'boolean' },
      { key: 'next_cursor', label: 'Next Cursor' },
    ],
  },
  humanSendMessage: {
    fields: [
      { key: 'messages', label: 'Messages', labelKey: 'message_type', listItems: rawMessageFields },
      { key: 'stopReason', label: 'Stop Reason', children: [
        { key: 'stop_reason', label: 'Reason' },
        { key: 'message_type', label: 'Record Type' },
      ] },
      { key: 'usage', label: 'Usage', children: usageFields },
      { key: 'success', label: 'Success', format: 'boolean' },
    ],
  },
  humanCreateIdentity: {
    fields: [
      { key: 'id', label: 'Identity ID' },
      { key: 'identifierKey', label: 'Identifier Key' },
      { key: 'name', label: 'Name' },
      { key: 'identityType', label: 'Identity Type' },
      { key: 'projectId', label: 'Project ID' },
      { key: 'properties', label: 'Properties', labelKey: 'key', listItems: [
        { key: 'key', label: 'Key' },
        { key: 'type', label: 'Type' },
        { key: 'value', label: 'Value' },
      ] },
      { key: 'success', label: 'Success', format: 'boolean' },
    ],
  },
  humanGetIdentities: {
    fields: [
      { key: 'identities', label: 'Identities', labelKey: 'name', listItems: identityFields },
      { key: 'count', label: 'Count', format: 'number' },
      { key: 'success', label: 'Success', format: 'boolean' },
    ],
  },
  humanCreateFromTemplate: {
    fields: [
      { key: 'agentIds', label: 'Agent IDs' },
      { key: 'deploymentId', label: 'Deployment ID' },
      { key: 'groupId', label: 'Group ID' },
      { key: 'success', label: 'Success', format: 'boolean' },
    ],
  },
  newAgentTrigger: {
    fields: [
      { key: 'id', label: 'Agent ID' },
      { key: 'name', label: 'Name' },
      { key: 'agent_type', label: 'Agent Type' },
      { key: 'model', label: 'Model' },
      { key: 'embedding', label: 'Embedding Model' },
      { key: 'description', label: 'Description' },
      { key: 'system', label: 'System Prompt' },
      { key: 'tags', label: 'Tags' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
      { key: 'updated_at', label: 'Updated At', format: 'datetime' },
      { key: 'last_run_completion', label: 'Last Run Completed At', format: 'datetime' },
      { key: 'last_stop_reason', label: 'Last Stop Reason' },
    ],
  },
  newMessageTrigger: { fields: rawMessageFields },
} satisfies Record<string, OutputSchema>;
