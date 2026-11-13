import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

function pageSchema({ label, labelKey, itemFields }: { label: string; labelKey: string; itemFields: OutputSchemaField[] }): OutputSchema {
  return {
    fields: [
      { key: 'items', label, labelKey, listItems: itemFields },
      { key: 'count', label: 'Items on This Page', format: 'number' },
      { key: 'pagination_key', label: 'Pagination Key', description: 'Pass as Pagination Key to fetch the next page.' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
      { key: 'total', label: 'Total Matches', format: 'number', description: 'Only filled when the API reports a total.' },
    ],
  };
}

const callSummaryFields: OutputSchemaField[] = [
  { key: 'call_id', label: 'Call ID' },
  { key: 'call_type', label: 'Call Type', description: 'phone_call or web_call.' },
  { key: 'call_status', label: 'Call Status', description: 'registered, not_connected, ongoing, ended or error.' },
  { key: 'direction', label: 'Direction' },
  { key: 'from_number', label: 'From Number' },
  { key: 'to_number', label: 'To Number' },
  { key: 'agent_id', label: 'Agent ID' },
  { key: 'agent_name', label: 'Agent Name' },
  { key: 'agent_version', label: 'Agent Version' },
  { key: 'batch_call_id', label: 'Batch Call ID' },
  { key: 'start_timestamp', label: 'Start Timestamp (ms)', format: 'number' },
  { key: 'start_time', label: 'Start Time', format: 'datetime' },
  { key: 'end_timestamp', label: 'End Timestamp (ms)', format: 'number' },
  { key: 'end_time', label: 'End Time', format: 'datetime' },
  { key: 'duration_ms', label: 'Duration (ms)', format: 'number' },
  { key: 'disconnection_reason', label: 'Disconnection Reason' },
  { key: 'call_summary', label: 'Call Summary' },
  { key: 'user_sentiment', label: 'User Sentiment' },
  { key: 'call_successful', label: 'Call Successful', format: 'boolean' },
  { key: 'in_voicemail', label: 'In Voicemail', format: 'boolean' },
  { key: 'custom_analysis_data', label: 'Custom Analysis Data', description: 'Post-call extraction fields defined on the agent.' },
  { key: 'combined_cost_cents', label: 'Combined Cost (cents)', format: 'number' },
  { key: 'metadata', label: 'Metadata' },
  { key: 'dynamic_variables', label: 'Dynamic Variables' },
  { key: 'collected_dynamic_variables', label: 'Collected Dynamic Variables' },
  { key: 'twilio_call_sid', label: 'Twilio Call SID' },
];

const callFields: OutputSchemaField[] = [
  ...callSummaryFields,
  { key: 'transcript', label: 'Transcript', description: 'Filled after the call ends.' },
  {
    key: 'recording_url',
    label: 'Recording URL',
    format: 'url',
    description: 'Expires if the agent uses signed URLs (opt_in_signed_url).',
  },
  { key: 'public_log_url', label: 'Public Log URL', format: 'url' },
];

const chatFields: OutputSchemaField[] = [
  { key: 'chat_id', label: 'Chat ID' },
  { key: 'agent_id', label: 'Agent ID' },
  { key: 'agent_version', label: 'Agent Version' },
  { key: 'chat_status', label: 'Chat Status', description: 'ongoing, ended or error.' },
  { key: 'chat_type', label: 'Chat Type' },
  { key: 'start_timestamp', label: 'Start Timestamp (ms)', format: 'number' },
  { key: 'start_time', label: 'Start Time', format: 'datetime' },
  { key: 'end_timestamp', label: 'End Timestamp (ms)', format: 'number' },
  { key: 'end_time', label: 'End Time', format: 'datetime' },
  { key: 'transcript', label: 'Transcript' },
  { key: 'chat_summary', label: 'Chat Summary' },
  { key: 'user_sentiment', label: 'User Sentiment' },
  { key: 'chat_successful', label: 'Chat Successful', format: 'boolean' },
  { key: 'custom_analysis_data', label: 'Custom Analysis Data' },
  { key: 'combined_cost_cents', label: 'Combined Cost (cents)', format: 'number' },
  { key: 'metadata', label: 'Metadata' },
];

const engineFields: OutputSchemaField[] = [
  { key: 'response_engine_type', label: 'Response Engine Type', description: 'retell-llm, conversation-flow or custom-llm.' },
  { key: 'llm_id', label: 'Retell LLM ID' },
  { key: 'conversation_flow_id', label: 'Conversation Flow ID' },
];

const agentFields: OutputSchemaField[] = [
  { key: 'agent_id', label: 'Agent ID' },
  { key: 'agent_name', label: 'Agent Name' },
  { key: 'version', label: 'Version', format: 'number' },
  { key: 'is_published', label: 'Is Published', format: 'boolean' },
  { key: 'voice_id', label: 'Voice ID' },
  { key: 'language', label: 'Language' },
  { key: 'webhook_url', label: 'Webhook URL', format: 'url' },
  ...engineFields,
  { key: 'last_modification_timestamp', label: 'Last Modified Timestamp (ms)', format: 'number' },
  { key: 'last_modified_time', label: 'Last Modified', format: 'datetime' },
];

const chatAgentFields: OutputSchemaField[] = agentFields.filter((field) => field.key !== 'voice_id');

const agentListItemFields: OutputSchemaField[] = [
  { key: 'agent_id', label: 'Agent ID' },
  { key: 'agent_name', label: 'Agent Name' },
  { key: 'channel', label: 'Channel', description: 'voice or chat.' },
  { key: 'version', label: 'Version', format: 'number' },
  { key: 'is_published', label: 'Is Published', format: 'boolean' },
  { key: 'last_modified_time', label: 'Last Modified', format: 'datetime' },
];

const agentVersionFields: OutputSchemaField[] = [
  { key: 'version', label: 'Version', format: 'number' },
  { key: 'is_published', label: 'Is Published', format: 'boolean' },
  { key: 'version_title', label: 'Version Title' },
  { key: 'version_description', label: 'Version Description' },
  { key: 'base_version', label: 'Base Version', format: 'number' },
  { key: 'last_modified_time', label: 'Last Modified', format: 'datetime' },
];

const agentWeightFields: OutputSchemaField[] = [
  { key: 'agent_id', label: 'Agent ID' },
  { key: 'agent_version', label: 'Agent Version' },
  { key: 'weight', label: 'Weight', format: 'number' },
];

const phoneNumberFields: OutputSchemaField[] = [
  { key: 'phone_number', label: 'Phone Number' },
  { key: 'phone_number_pretty', label: 'Phone Number (Formatted)' },
  { key: 'phone_number_type', label: 'Phone Number Type' },
  { key: 'nickname', label: 'Nickname' },
  { key: 'area_code', label: 'Area Code', format: 'number' },
  { key: 'inbound_agent_id', label: 'Inbound Agent ID', description: 'First inbound agent when several are weighted.' },
  { key: 'outbound_agent_id', label: 'Outbound Agent ID', description: 'First outbound agent when several are weighted.' },
  { key: 'inbound_agents', label: 'Inbound Agents', labelKey: 'agent_id', listItems: agentWeightFields },
  { key: 'outbound_agents', label: 'Outbound Agents', labelKey: 'agent_id', listItems: agentWeightFields },
  { key: 'inbound_webhook_url', label: 'Inbound Webhook URL', format: 'url' },
  { key: 'last_modified_time', label: 'Last Modified', format: 'datetime' },
];

const voiceFields: OutputSchemaField[] = [
  { key: 'voice_id', label: 'Voice ID' },
  { key: 'voice_name', label: 'Voice Name' },
  { key: 'provider', label: 'Provider' },
  { key: 'accent', label: 'Accent' },
  { key: 'gender', label: 'Gender' },
  { key: 'age', label: 'Age' },
  { key: 'preview_audio_url', label: 'Preview Audio URL', format: 'url' },
];

const knowledgeBaseFields: OutputSchemaField[] = [
  { key: 'knowledge_base_id', label: 'Knowledge Base ID' },
  { key: 'knowledge_base_name', label: 'Name' },
  { key: 'status', label: 'Status', description: 'in_progress, complete, error or refreshing_in_progress.' },
  { key: 'enable_auto_refresh', label: 'Auto Refresh', format: 'boolean' },
  { key: 'source_count', label: 'Source Count', format: 'number' },
  {
    key: 'sources',
    label: 'Sources',
    labelKey: 'title',
    listItems: [
      { key: 'source_id', label: 'Source ID' },
      { key: 'type', label: 'Type', description: 'document, text or url.' },
      { key: 'title', label: 'Title or File Name' },
      { key: 'url', label: 'URL', format: 'url' },
    ],
  },
  { key: 'last_refreshed_time', label: 'Last Refreshed', format: 'datetime' },
];

const llmFields: OutputSchemaField[] = [
  { key: 'llm_id', label: 'Retell LLM ID' },
  { key: 'version', label: 'Version', format: 'number' },
  { key: 'is_published', label: 'Is Published', format: 'boolean' },
  { key: 'model', label: 'Model' },
  { key: 'start_speaker', label: 'Start Speaker' },
  { key: 'general_prompt', label: 'General Prompt' },
  { key: 'begin_message', label: 'Begin Message' },
  { key: 'knowledge_base_ids', label: 'Knowledge Base IDs', description: 'Comma-separated.' },
  { key: 'last_modified_time', label: 'Last Modified', format: 'datetime' },
];

const contactFields: OutputSchemaField[] = [
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'phone_number', label: 'Phone Number' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'do_not_call', label: 'Do Not Call', format: 'boolean' },
  { key: 'contact_memory', label: 'Contact Memory' },
  { key: 'external_id', label: 'External ID' },
  { key: 'tags', label: 'Tags', description: 'Comma-separated tag labels.' },
  { key: 'custom_fields', label: 'Custom Fields' },
  { key: 'conversation_count', label: 'Conversation Count', format: 'number' },
  { key: 'last_conversation_time', label: 'Last Conversation', format: 'datetime' },
  { key: 'created_time', label: 'Created', format: 'datetime' },
];

const deletedFields = ({ idKey, idLabel }: { idKey: string; idLabel: string }): OutputSchema => ({
  fields: [
    { key: idKey, label: idLabel },
    { key: 'deleted', label: 'Deleted', format: 'boolean' },
    { key: 'already_deleted', label: 'Already Deleted', format: 'boolean', description: 'True when Retell answered 404.' },
  ],
});

const rawCallFields: OutputSchemaField[] = [
  { key: 'call_id', label: 'Call ID' },
  { key: 'call_type', label: 'Call Type' },
  { key: 'call_status', label: 'Call Status' },
  { key: 'direction', label: 'Direction' },
  { key: 'from_number', label: 'From Number' },
  { key: 'to_number', label: 'To Number' },
  { key: 'agent_id', label: 'Agent ID' },
  { key: 'agent_version', label: 'Agent Version', format: 'number' },
  { key: 'start_timestamp', label: 'Start Timestamp (ms)', format: 'number' },
  { key: 'end_timestamp', label: 'End Timestamp (ms)', format: 'number' },
  { key: 'duration_ms', label: 'Duration (ms)', format: 'number' },
  { key: 'disconnection_reason', label: 'Disconnection Reason' },
  { key: 'transcript', label: 'Transcript' },
  { key: 'recording_url', label: 'Recording URL', format: 'url' },
  { key: 'public_log_url', label: 'Public Log URL', format: 'url' },
  { key: 'metadata', label: 'Metadata' },
  { key: 'retell_llm_dynamic_variables', label: 'Dynamic Variables' },
  {
    key: 'call_analysis',
    label: 'Call Analysis',
    children: [
      { key: 'call_summary', label: 'Call Summary' },
      { key: 'user_sentiment', label: 'User Sentiment' },
      { key: 'call_successful', label: 'Call Successful', format: 'boolean' },
      { key: 'in_voicemail', label: 'In Voicemail', format: 'boolean' },
      { key: 'custom_analysis_data', label: 'Custom Analysis Data' },
    ],
  },
  {
    key: 'call_cost',
    label: 'Call Cost',
    children: [
      { key: 'combined_cost', label: 'Combined Cost (cents)', format: 'number' },
      { key: 'total_duration_seconds', label: 'Billed Duration (s)', format: 'number' },
    ],
  },
];

const rawPhoneNumberFields: OutputSchemaField[] = [
  { key: 'phone_number', label: 'Phone Number' },
  { key: 'phone_number_pretty', label: 'Phone Number (Formatted)' },
  { key: 'phone_number_type', label: 'Phone Number Type' },
  { key: 'nickname', label: 'Nickname' },
  { key: 'area_code', label: 'Area Code', format: 'number' },
  { key: 'inbound_agents', label: 'Inbound Agents', labelKey: 'agent_id', listItems: agentWeightFields },
  { key: 'outbound_agents', label: 'Outbound Agents', labelKey: 'agent_id', listItems: agentWeightFields },
  { key: 'inbound_webhook_url', label: 'Inbound Webhook URL', format: 'url' },
  { key: 'last_modification_timestamp', label: 'Last Modified Timestamp (ms)', format: 'number' },
];

const rawAgentFields: OutputSchemaField[] = [
  { key: 'agent_id', label: 'Agent ID' },
  { key: 'agent_name', label: 'Agent Name' },
  { key: 'version', label: 'Version', format: 'number' },
  { key: 'is_published', label: 'Is Published', format: 'boolean' },
  { key: 'voice_id', label: 'Voice ID' },
  { key: 'language', label: 'Language' },
  { key: 'webhook_url', label: 'Webhook URL', format: 'url' },
  {
    key: 'response_engine',
    label: 'Response Engine',
    children: [
      { key: 'type', label: 'Type' },
      { key: 'llm_id', label: 'Retell LLM ID' },
      { key: 'conversation_flow_id', label: 'Conversation Flow ID' },
      { key: 'version', label: 'Version', format: 'number' },
    ],
  },
  { key: 'last_modification_timestamp', label: 'Last Modified Timestamp (ms)', format: 'number' },
];

const webhookCallFields: OutputSchemaField[] = [
  { key: 'event', label: 'Event', description: 'call_started, call_ended or call_analyzed.' },
  { key: 'call', label: 'Call', children: rawCallFields },
];

export const retellSchemas = {
  call: { fields: callFields } satisfies OutputSchema,
  callPage: pageSchema({ label: 'Calls', labelKey: 'call_id', itemFields: callSummaryFields }),
  webCall: {
    fields: [
      { key: 'call_id', label: 'Call ID' },
      { key: 'access_token', label: 'Access Token', description: 'Pass to the Retell web client SDK within 30 seconds.' },
      { key: 'expires_at', label: 'Token Expires At' },
    ],
  } satisfies OutputSchema,
  chat: { fields: chatFields } satisfies OutputSchema,
  chatPage: pageSchema({ label: 'Chats', labelKey: 'chat_id', itemFields: chatFields.filter((field) => field.key !== 'transcript') }),
  chatCompletion: {
    fields: [
      { key: 'reply', label: 'Agent Reply', description: 'Agent messages from this turn joined by new lines.' },
      { key: 'message_count', label: 'Message Count', format: 'number' },
      {
        key: 'messages',
        label: 'Messages',
        labelKey: 'role',
        listItems: [
          { key: 'message_id', label: 'Message ID' },
          { key: 'role', label: 'Role', description: 'agent, user or a tool-call role.' },
          { key: 'content', label: 'Content' },
          { key: 'created_timestamp', label: 'Created Timestamp (ms)', format: 'number' },
        ],
      },
    ],
  } satisfies OutputSchema,
  agent: { fields: agentFields } satisfies OutputSchema,
  chatAgent: { fields: chatAgentFields } satisfies OutputSchema,
  agentPage: pageSchema({ label: 'Agents', labelKey: 'agent_name', itemFields: agentListItemFields }),
  agentVersionPage: pageSchema({ label: 'Versions', labelKey: 'version', itemFields: agentVersionFields }),
  agentPublished: {
    fields: [
      { key: 'agent_id', label: 'Agent ID' },
      { key: 'version', label: 'Version', format: 'number' },
      { key: 'published', label: 'Published', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  phoneNumber: { fields: phoneNumberFields } satisfies OutputSchema,
  phoneNumberPage: pageSchema({ label: 'Phone Numbers', labelKey: 'phone_number', itemFields: phoneNumberFields }),
  voice: { fields: voiceFields } satisfies OutputSchema,
  voiceList: {
    fields: [
      { key: 'items', label: 'Voices', labelKey: 'voice_name', listItems: voiceFields },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  knowledgeBase: { fields: knowledgeBaseFields } satisfies OutputSchema,
  knowledgeBaseList: {
    fields: [
      { key: 'items', label: 'Knowledge Bases', labelKey: 'knowledge_base_name', listItems: knowledgeBaseFields },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  } satisfies OutputSchema,
  llm: { fields: llmFields } satisfies OutputSchema,
  llmPage: pageSchema({ label: 'Retell LLMs', labelKey: 'llm_id', itemFields: llmFields }),
  contact: { fields: contactFields } satisfies OutputSchema,
  contactLookup: {
    fields: [{ key: 'found', label: 'Found', format: 'boolean' }, ...contactFields],
  } satisfies OutputSchema,
  contactPage: pageSchema({ label: 'Contacts', labelKey: 'phone_number', itemFields: contactFields }),
  concurrency: {
    fields: [
      { key: 'current_concurrency', label: 'Current Concurrency', format: 'number' },
      { key: 'concurrency_limit', label: 'Concurrency Limit', format: 'number' },
      { key: 'available_concurrency', label: 'Available Concurrency', format: 'number' },
      { key: 'base_concurrency', label: 'Base Concurrency', format: 'number' },
      { key: 'purchased_concurrency', label: 'Purchased Concurrency', format: 'number' },
      { key: 'reserved_inbound_concurrency', label: 'Reserved Inbound Concurrency', format: 'number' },
      { key: 'concurrency_burst_enabled', label: 'Burst Enabled', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  batchCall: {
    fields: [
      { key: 'batch_call_id', label: 'Batch Call ID' },
      { key: 'name', label: 'Name' },
      { key: 'from_number', label: 'From Number' },
      { key: 'scheduled_timestamp', label: 'Scheduled Timestamp (ms)', format: 'number' },
      { key: 'scheduled_time', label: 'Scheduled Time', format: 'datetime' },
      { key: 'total_task_count', label: 'Total Calls', format: 'number' },
    ],
  } satisfies OutputSchema,
  callStopped: {
    fields: [
      { key: 'call_id', label: 'Call ID' },
      { key: 'stopped', label: 'Stopped', format: 'boolean' },
      { key: 'reason', label: 'Reason', description: 'Why the call was not stopped, if it was not.' },
    ],
  } satisfies OutputSchema,
  chatEnded: {
    fields: [
      { key: 'chat_id', label: 'Chat ID' },
      { key: 'ended', label: 'Ended', format: 'boolean' },
    ],
  } satisfies OutputSchema,
  deleted: deletedFields,
  rawCall: { fields: rawCallFields } satisfies OutputSchema,
  rawPhoneNumber: { fields: rawPhoneNumberFields } satisfies OutputSchema,
  rawAgent: { fields: rawAgentFields } satisfies OutputSchema,
  rawVoice: { fields: voiceFields } satisfies OutputSchema,
  webhookCall: { fields: webhookCallFields } satisfies OutputSchema,
};
