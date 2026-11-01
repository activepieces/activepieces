import {
  OutputSchema,
  OutputSchemaField,
} from '@activepieces/pieces-framework';

const executionFields: OutputSchemaField[] = [
  { key: 'id', label: 'Execution ID' },
  { key: 'agent_id', label: 'Agent ID' },
  { key: 'batch_id', label: 'Batch ID' },
  { key: 'status', label: 'Status' },
  { key: 'smart_status', label: 'Smart Status' },
  { key: 'error_message', label: 'Error Message' },
  {
    key: 'answered_by_voice_mail',
    label: 'Answered By Voicemail',
    format: 'boolean',
  },
  {
    key: 'conversation_duration',
    label: 'Conversation Duration (seconds)',
    format: 'number',
  },
  { key: 'total_cost', label: 'Total Cost (cents)', format: 'number' },
  { key: 'transcript', label: 'Transcript' },
  { key: 'summary', label: 'Summary' },
  { key: 'extracted_data', label: 'Extracted Data' },
  { key: 'custom_extractions', label: 'Custom Extractions' },
  { key: 'user_number', label: 'User Number' },
  { key: 'agent_number', label: 'Agent Number' },
  { key: 'provider', label: 'Provider' },
  {
    key: 'telephony_data',
    label: 'Telephony Data',
    children: [
      { key: 'duration', label: 'Duration (seconds)' },
      { key: 'to_number', label: 'To Number' },
      { key: 'from_number', label: 'From Number' },
      { key: 'recording_url', label: 'Recording URL', format: 'url' },
      { key: 'call_type', label: 'Call Type' },
      { key: 'provider', label: 'Provider' },
      { key: 'provider_call_id', label: 'Provider Call ID' },
      { key: 'hangup_by', label: 'Hung Up By' },
      { key: 'hangup_reason', label: 'Hangup Reason' },
    ],
  },
  {
    key: 'context_details',
    label: 'Context Details',
    children: [
      { key: 'recipient_phone_number', label: 'Recipient Phone Number' },
      { key: 'recipient_data', label: 'Recipient Data' },
    ],
  },
  { key: 'scheduled_at', label: 'Scheduled At', format: 'datetime' },
  { key: 'rescheduled_at', label: 'Rescheduled At', format: 'datetime' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const callResponseSchema: OutputSchema = {
  fields: [
    { key: 'message', label: 'Message' },
    { key: 'status', label: 'Status' },
    { key: 'execution_id', label: 'Execution ID' },
  ],
};

const executionSchema: OutputSchema = { fields: executionFields };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter(isRecord);
  }
  if (isRecord(value) && Array.isArray(value['data'])) {
    return value['data'].filter(isRecord);
  }
  return [];
}

function pick({
  source,
  keys,
}: {
  source: Record<string, unknown>;
  keys: string[];
}): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const key of keys) {
    result[key] = source[key] ?? null;
  }
  return result;
}

export const bolnaSchemas = {
  executionFields,
  executionSchema,
  callResponseSchema,
  isRecord,
  asArray,
  pick,
};
