import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const callFields: OutputSchemaField[] = [
  { key: 'id', label: 'Call ID', description: 'Use this to get or delete the call later.' },
  { key: 'type', label: 'Type', description: 'e.g. outboundPhoneCall, inboundPhoneCall, webCall.' },
  { key: 'status', label: 'Status', description: 'scheduled, queued, ringing, in-progress, forwarding or ended.' },
  { key: 'endedReason', label: 'Ended Reason' },
  { key: 'name', label: 'Call Name' },
  { key: 'assistantId', label: 'Assistant ID' },
  { key: 'squadId', label: 'Squad ID' },
  { key: 'phoneNumberId', label: 'Phone Number ID' },
  {
    key: 'customer',
    label: 'Customer',
    children: [
      { key: 'number', label: 'Customer Number' },
      { key: 'name', label: 'Customer Name' },
    ],
  },
  { key: 'startedAt', label: 'Started At', format: 'datetime' },
  { key: 'endedAt', label: 'Ended At', format: 'datetime' },
  { key: 'cost', label: 'Cost (USD)', format: 'number' },
  {
    key: 'artifact',
    label: 'Artifact',
    children: [
      { key: 'transcript', label: 'Transcript' },
      { key: 'recordingUrl', label: 'Recording URL', format: 'url' },
      { key: 'stereoRecordingUrl', label: 'Stereo Recording URL', format: 'url' },
    ],
  },
  {
    key: 'analysis',
    label: 'Analysis',
    children: [
      { key: 'summary', label: 'Summary' },
      { key: 'successEvaluation', label: 'Success Evaluation' },
    ],
  },
  { key: 'orgId', label: 'Organization ID' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const assistantFields: OutputSchemaField[] = [
  { key: 'id', label: 'Assistant ID' },
  { key: 'name', label: 'Name' },
  { key: 'firstMessage', label: 'First Message' },
  { key: 'firstMessageMode', label: 'First Message Mode' },
  { key: 'endCallMessage', label: 'End Call Message' },
  {
    key: 'model',
    label: 'Model',
    children: [
      { key: 'provider', label: 'Model Provider' },
      { key: 'model', label: 'Model Name' },
      { key: 'temperature', label: 'Temperature', format: 'number' },
    ],
  },
  {
    key: 'voice',
    label: 'Voice',
    children: [
      { key: 'provider', label: 'Voice Provider' },
      { key: 'voiceId', label: 'Voice ID' },
    ],
  },
  {
    key: 'server',
    label: 'Server',
    children: [{ key: 'url', label: 'Server URL', format: 'url' }],
  },
  { key: 'orgId', label: 'Organization ID' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const phoneNumberFields: OutputSchemaField[] = [
  { key: 'id', label: 'Phone Number ID' },
  { key: 'number', label: 'Number' },
  { key: 'name', label: 'Name' },
  { key: 'provider', label: 'Provider', description: 'vapi, twilio, vonage, telnyx or byo-phone-number.' },
  { key: 'status', label: 'Status' },
  { key: 'assistantId', label: 'Assistant ID' },
  { key: 'squadId', label: 'Squad ID' },
  { key: 'orgId', label: 'Organization ID' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const toolFields: OutputSchemaField[] = [
  { key: 'id', label: 'Tool ID' },
  { key: 'type', label: 'Type', description: 'e.g. function, transferCall, endCall, apiRequest, query.' },
  {
    key: 'function',
    label: 'Function',
    children: [
      { key: 'name', label: 'Function Name' },
      { key: 'description', label: 'Function Description' },
    ],
  },
  {
    key: 'server',
    label: 'Server',
    children: [{ key: 'url', label: 'Server URL', format: 'url' }],
  },
  { key: 'orgId', label: 'Organization ID' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const squadFields: OutputSchemaField[] = [
  { key: 'id', label: 'Squad ID' },
  { key: 'name', label: 'Name' },
  {
    key: 'members',
    label: 'Members',
    listItems: [{ key: 'assistantId', label: 'Assistant ID' }],
  },
  { key: 'orgId', label: 'Organization ID' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const fileFields: OutputSchemaField[] = [
  { key: 'id', label: 'File ID' },
  { key: 'name', label: 'Name' },
  { key: 'originalName', label: 'Original Name' },
  { key: 'mimetype', label: 'MIME Type' },
  { key: 'bytes', label: 'Size', format: 'filesize' },
  { key: 'status', label: 'Status', description: 'processing, done or failed.' },
  { key: 'url', label: 'URL', format: 'url' },
  { key: 'orgId', label: 'Organization ID' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'updatedAt', label: 'Updated At', format: 'datetime' },
];

const placedCallFields: OutputSchemaField[] = [
  { key: 'id', label: 'Call ID', description: 'Pass this to Get Call Result to read the outcome.' },
  { key: 'status', label: 'Status' },
  { key: 'assistantId', label: 'Assistant ID' },
  { key: 'phoneNumberId', label: 'Phone Number ID' },
  { key: 'customerNumber', label: 'Customer Number' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
];

const callResultFields: OutputSchemaField[] = [
  { key: 'id', label: 'Call ID' },
  { key: 'status', label: 'Status' },
  { key: 'endedReason', label: 'Ended Reason' },
  { key: 'startedAt', label: 'Started At', format: 'datetime' },
  { key: 'endedAt', label: 'Ended At', format: 'datetime' },
  { key: 'durationSeconds', label: 'Duration (seconds)', format: 'number' },
  { key: 'cost', label: 'Cost (USD)', format: 'number' },
  { key: 'summary', label: 'Summary' },
  { key: 'transcript', label: 'Transcript' },
  { key: 'recordingUrl', label: 'Recording URL', format: 'url' },
  { key: 'successEvaluation', label: 'Success Evaluation' },
];

const callSummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Call ID' },
  { key: 'status', label: 'Status' },
  { key: 'endedReason', label: 'Ended Reason' },
  { key: 'customerNumber', label: 'Customer Number' },
  { key: 'createdAt', label: 'Created At', format: 'datetime' },
  { key: 'cost', label: 'Cost (USD)', format: 'number' },
];

const assistantSettingsFields: OutputSchemaField[] = [
  { key: 'id', label: 'Assistant ID' },
  { key: 'name', label: 'Name' },
  { key: 'firstMessage', label: 'First Message' },
  { key: 'endCallMessage', label: 'End Call Message' },
  { key: 'model', label: 'Model Name' },
  { key: 'provider', label: 'Model Provider' },
  { key: 'systemPrompt', label: 'System Prompt' },
];

export const vapiOutputSchemas = {
  call: { fields: callFields },
  listCalls: { fields: [{ key: 'calls', label: 'Calls', labelKey: 'id', listItems: callFields }] },
  placedCall: { fields: placedCallFields },
  callResult: { fields: callResultFields },
  findCalls: { fields: [{ key: 'calls', label: 'Calls', labelKey: 'id', listItems: callSummaryFields }] },
  assistant: { fields: assistantFields },
  listAssistants: {
    fields: [{ key: 'assistants', label: 'Assistants', labelKey: 'name', listItems: assistantFields }],
  },
  assistantSettings: { fields: assistantSettingsFields },
  findAssistant: {
    fields: [
      {
        key: 'assistants',
        label: 'Assistants',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Assistant ID' },
          { key: 'name', label: 'Name' },
          { key: 'createdAt', label: 'Created At', format: 'datetime' },
        ],
      },
    ],
  },
  phoneNumber: { fields: phoneNumberFields },
  listPhoneNumbers: {
    fields: [{ key: 'phoneNumbers', label: 'Phone Numbers', labelKey: 'number', listItems: phoneNumberFields }],
  },
  findPhoneNumber: {
    fields: [
      {
        key: 'phoneNumbers',
        label: 'Phone Numbers',
        labelKey: 'number',
        listItems: [
          { key: 'id', label: 'Phone Number ID' },
          { key: 'number', label: 'Number' },
          { key: 'name', label: 'Name' },
          { key: 'provider', label: 'Provider' },
          { key: 'assistantId', label: 'Assistant ID' },
          { key: 'squadId', label: 'Squad ID' },
        ],
      },
    ],
  },
  tool: { fields: toolFields },
  listTools: { fields: [{ key: 'tools', label: 'Tools', labelKey: 'id', listItems: toolFields }] },
  findTool: {
    fields: [
      {
        key: 'tools',
        label: 'Tools',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Tool ID' },
          { key: 'type', label: 'Type' },
          { key: 'name', label: 'Name' },
          { key: 'description', label: 'Description' },
        ],
      },
    ],
  },
  squad: { fields: squadFields },
  listSquads: { fields: [{ key: 'squads', label: 'Squads', labelKey: 'name', listItems: squadFields }] },
  findSquad: {
    fields: [
      {
        key: 'squads',
        label: 'Squads',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'Squad ID' },
          { key: 'name', label: 'Name' },
          { key: 'memberAssistantIds', label: 'Member Assistant IDs' },
        ],
      },
    ],
  },
  file: { fields: fileFields },
  listFiles: { fields: [{ key: 'files', label: 'Files', labelKey: 'name', listItems: fileFields }] },
  findFile: {
    fields: [
      {
        key: 'files',
        label: 'Files',
        labelKey: 'name',
        listItems: [
          { key: 'id', label: 'File ID' },
          { key: 'name', label: 'Name' },
          { key: 'status', label: 'Status' },
          { key: 'bytes', label: 'Size', format: 'filesize' },
          { key: 'createdAt', label: 'Created At', format: 'datetime' },
        ],
      },
    ],
  },
} satisfies Record<string, OutputSchema>;
