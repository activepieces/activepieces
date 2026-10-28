import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const toolResultFields: OutputSchemaField[] = [
  { key: 'output_file', label: 'Output File', format: 'url' },
  { key: 'download_filename', label: 'File Name' },
  { key: 'output_filesize', label: 'Output Size', format: 'filesize' },
  { key: 'filesize', label: 'Input Size', format: 'filesize' },
  { key: 'output_filenumber', label: 'Number of Output Files', format: 'number' },
  { key: 'output_extensions', label: 'Output Extensions' },
  { key: 'status', label: 'Status' },
  { key: 'timer', label: 'Processing Time (s)' },
  { key: 'task', label: 'Task ID' },
  { key: 'remaining_credits', label: 'Remaining Credits', format: 'number' },
];

const signerFields: OutputSchemaField[] = [
  { key: 'uuid', label: 'Signer ID' },
  { key: 'name', label: 'Name' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'type', label: 'Role' },
  { key: 'status', label: 'Status' },
  { key: 'token_signer', label: 'Signer Token' },
];

const signatureFields: OutputSchemaField[] = [
  { key: 'token_requester', label: 'Requester Token' },
  { key: 'uuid', label: 'Signature ID' },
  { key: 'status', label: 'Status' },
  { key: 'subject_signer', label: 'Email Subject' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'expires', label: 'Expires', format: 'datetime' },
  { key: 'certified', label: 'Certified', format: 'boolean' },
  { key: 'server', label: 'Server' },
  { key: 'signers', label: 'Signers', labelKey: 'email', listItems: signerFields },
  {
    key: 'files',
    label: 'Files',
    labelKey: 'filename',
    listItems: [
      { key: 'filename', label: 'File Name' },
      { key: 'pages', label: 'Pages', format: 'number' },
    ],
  },
];

const toolResult: OutputSchema = { fields: toolResultFields };

const extractText: OutputSchema = {
  fields: [
    ...toolResultFields,
    { key: 'text', label: 'Text' },
    { key: 'text_length', label: 'Text Length', format: 'number' },
    { key: 'text_truncated', label: 'Text Truncated', format: 'boolean' },
    { key: 'detailed_total_rows', label: 'Detailed Total Rows', format: 'number' },
    { key: 'detailed_truncated', label: 'Detailed Truncated', format: 'boolean' },
    {
      key: 'detailed',
      label: 'Detailed Words',
      listItems: [
        { key: 'PageNo', label: 'Page', format: 'number' },
        { key: 'XPos', label: 'X Position', format: 'number' },
        { key: 'YPos', label: 'Y Position', format: 'number' },
        { key: 'XWidth', label: 'Width', format: 'number' },
        { key: 'YWidth', label: 'Height', format: 'number' },
        { key: 'FontName', label: 'Font' },
        { key: 'FontSize', label: 'Font Size', format: 'number' },
        { key: 'Length', label: 'Length', format: 'number' },
        { key: 'Text', label: 'Text' },
      ],
    },
    { key: 'detailed_parse_error', label: 'Detailed Parse Error' },
  ],
};

const validatePdfa: OutputSchema = {
  fields: [
    { key: 'conformant', label: 'All Files Conformant', format: 'boolean' },
    {
      key: 'validations',
      label: 'Validations',
      labelKey: 'server_filename',
      listItems: [
        { key: 'server_filename', label: 'Server File Name' },
        { key: 'status', label: 'Result' },
        { key: 'reason', label: 'Reasons' },
      ],
    },
    { key: 'status', label: 'Status' },
    { key: 'timer', label: 'Processing Time (s)' },
    { key: 'task', label: 'Task ID' },
    { key: 'remaining_credits', label: 'Remaining Credits', format: 'number' },
  ],
};

const signature: OutputSchema = { fields: signatureFields };

const signatureAck: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'token_requester', label: 'Requester Token' },
    { key: 'days', label: 'Days Added', format: 'number' },
  ],
};

const signatureDownload: OutputSchema = {
  fields: [
    { key: 'output_file', label: 'File', format: 'url' },
    { key: 'file_name', label: 'File Name' },
    { key: 'size', label: 'Size', format: 'filesize' },
    { key: 'content_type', label: 'Content Type' },
    { key: 'token_requester', label: 'Requester Token' },
  ],
};

const signatureList: OutputSchema = {
  fields: [
    { key: 'items', label: 'Signature Requests', labelKey: 'token_requester', listItems: signatureFields },
    { key: 'count', label: 'Count on This Page', format: 'number' },
    { key: 'page', label: 'Page', format: 'number' },
    { key: 'per_page', label: 'Per Page', format: 'number' },
    { key: 'next_page', label: 'Next Page', format: 'number' },
    { key: 'has_more', label: 'May Have More', format: 'boolean' },
  ],
};

const signerInfo: OutputSchema = {
  fields: [
    ...signerFields,
    { key: 'phone', label: 'Phone' },
    { key: 'access_code', label: 'Has Access Code' },
    { key: 'signed', label: 'Signed At', format: 'datetime' },
  ],
};

const taskEvent: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event' },
    {
      key: 'task',
      label: 'Task',
      value: 'data.task',
      children: [
        { key: 'task', label: 'Task ID' },
        { key: 'tool', label: 'Tool' },
        { key: 'status', label: 'Status' },
        { key: 'status_message', label: 'Status Message' },
        { key: 'message', label: 'Message' },
        { key: 'server', label: 'Server' },
        { key: 'download_filename', label: 'File Name' },
        { key: 'filesize', label: 'Input Size', format: 'filesize' },
        { key: 'output_filesize', label: 'Output Size', format: 'filesize' },
        { key: 'output_filenumber', label: 'Number of Output Files', format: 'number' },
        { key: 'output_extensions', label: 'Output Extensions' },
        { key: 'file_number', label: 'Number of Input Files', format: 'number' },
        { key: 'process_start', label: 'Process Start' },
        { key: 'timer', label: 'Processing Time (s)' },
        { key: 'custom_int', label: 'Custom Integer', format: 'number' },
        { key: 'custom_string', label: 'Custom String' },
      ],
    },
  ],
};

const signatureEvent: OutputSchema = {
  fields: [
    { key: 'event', label: 'Event' },
    { key: 'signature', label: 'Signature', value: 'data.signature', children: signatureFields },
    { key: 'signer', label: 'Signer', value: 'data.signer', children: signerFields },
  ],
};

export const iloveSchemas = {
  toolResult,
  extractText,
  validatePdfa,
  signature,
  signatureAck,
  signatureDownload,
  signatureList,
  signerInfo,
  taskEvent,
  signatureEvent,
};
