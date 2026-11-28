import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const recipientItems: OutputSchemaField[] = [
  { key: 'id', label: 'Recipient ID', value: 'id' },
  { key: 'role', label: 'Role', value: 'role' },
  { key: 'name', label: 'Name', value: 'name' },
  { key: 'email', label: 'Email', value: 'email', format: 'email' },
  { key: 'status', label: 'Status', value: 'status' },
  { key: 'viewed_at', label: 'Viewed At', value: 'viewed_at', format: 'datetime' },
  { key: 'signed_at', label: 'Signed At', value: 'signed_at', format: 'datetime' },
  { key: 'declined_at', label: 'Declined At', value: 'declined_at', format: 'datetime' },
  { key: 'decline_reason', label: 'Decline Reason', value: 'decline_reason' },
];

const documentFields: OutputSchemaField[] = [
  { key: 'document_id', label: 'Document ID', value: 'document_id' },
  { key: 'title', label: 'Title', value: 'title' },
  { key: 'status', label: 'Status', value: 'status' },
  { key: 'external_id', label: 'External ID', value: 'external_id' },
  { key: 'template_id', label: 'Template ID', value: 'template_id' },
  { key: 'source', label: 'Source', value: 'source' },
  { key: 'created_at', label: 'Created At', value: 'created_at', format: 'datetime' },
  { key: 'sent_at', label: 'Sent At', value: 'sent_at', format: 'datetime' },
  { key: 'completed_at', label: 'Completed At', value: 'completed_at', format: 'datetime' },
  { key: 'voided_at', label: 'Voided At', value: 'voided_at', format: 'datetime' },
  { key: 'recipients', label: 'Recipients', value: 'recipients', labelKey: 'email', listItems: recipientItems },
];

const fieldValues: OutputSchemaField = {
  key: 'field_values',
  label: 'Field Values',
  value: 'field_values',
  description: 'The values signers filled in, by field label.',
};

const eventFields: OutputSchemaField[] = [
  { key: 'event_id', label: 'Event ID', value: 'event_id' },
  { key: 'event_type', label: 'Event Type', value: 'event_type' },
];

const sendDocument: OutputSchema = {
  fields: [
    { key: 'document_id', label: 'Document ID', value: 'document_id' },
    { key: 'title', label: 'Title', value: 'title' },
    { key: 'status', label: 'Status', value: 'status' },
    { key: 'external_id', label: 'External ID', value: 'external_id' },
    { key: 'template_id', label: 'Template ID', value: 'template_id' },
    { key: 'created_at', label: 'Created At', value: 'created_at', format: 'datetime' },
    {
      key: 'recipients',
      label: 'Recipients',
      value: 'recipients',
      labelKey: 'email',
      listItems: [
        { key: 'id', label: 'Recipient ID', value: 'id' },
        { key: 'role_id', label: 'Template Role ID', value: 'role_id' },
        { key: 'role', label: 'Role', value: 'role' },
        { key: 'name', label: 'Name', value: 'name' },
        { key: 'email', label: 'Email', value: 'email', format: 'email' },
        { key: 'status', label: 'Status', value: 'status' },
      ],
    },
  ],
};

const createDraft: OutputSchema = {
  fields: [
    { key: 'document_id', label: 'Document ID', value: 'document_id' },
    { key: 'status', label: 'Status', value: 'status' },
    { key: 'review_url', label: 'Review Link', value: 'review_url', format: 'url' },
    { key: 'app_url', label: 'Open in Inkly', value: 'app_url', format: 'url' },
  ],
};

const getDocument: OutputSchema = {
  fields: [...documentFields, fieldValues],
};

const downloadSignedPdf: OutputSchema = {
  fields: [
    { key: 'document_id', label: 'Document ID', value: 'document_id' },
    { key: 'file_name', label: 'File Name', value: 'file_name' },
    { key: 'file', label: 'Signed PDF', value: 'file' },
  ],
};

const documentSent: OutputSchema = {
  fields: [...eventFields, ...documentFields],
};

const signerSigned: OutputSchema = {
  fields: [
    ...eventFields,
    { key: 'signer_id', label: 'Signer ID', value: 'signer_id' },
    { key: 'signer_name', label: 'Signer Name', value: 'signer_name' },
    { key: 'signer_email', label: 'Signer Email', value: 'signer_email', format: 'email' },
    { key: 'signer_signed_at', label: 'Signed At', value: 'signer_signed_at', format: 'datetime' },
    ...documentFields,
  ],
};

const documentCompleted: OutputSchema = {
  fields: [
    ...eventFields,
    ...documentFields,
    fieldValues,
    { key: 'signed_pdf', label: 'Signed PDF', value: 'signed_pdf' },
    { key: 'signed_pdf_file_name', label: 'Signed PDF File Name', value: 'signed_pdf_file_name' },
  ],
};

export const inklyOutputSchemas = {
  sendDocument,
  createDraft,
  getDocument,
  downloadSignedPdf,
  documentSent,
  signerSigned,
  documentCompleted,
};
