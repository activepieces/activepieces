import { OutputSchema } from '@activepieces/pieces-framework';

type Fields = OutputSchema['fields'];

const documentFields: Fields = [
  { key: 'id', label: 'Document ID' },
  { key: 'status', label: 'Status', description: 'draft, pending, generating, success or failure.' },
  { key: 'filename', label: 'File Name' },
  { key: 'download_url', label: 'Download URL', format: 'url', description: 'Signed link to the file, valid for 1 hour. Empty until status is success.' },
  { key: 'public_share_link', label: 'Public Share Link', format: 'url', description: 'Permanent public link. Only on plans with Share Links.' },
  { key: 'preview_url', label: 'Preview URL', format: 'url' },
  { key: 'failure_cause', label: 'Failure Cause' },
  { key: 'output_type', label: 'Output Type', description: 'pdf or image.' },
  { key: 'document_template_id', label: 'Template ID' },
  { key: 'document_template_identifier', label: 'Template Name' },
  { key: 'meta', label: 'Meta (JSON)', description: 'The document metadata as a JSON string.' },
  { key: 'app_id', label: 'Workspace ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

const fullDocumentFields: Fields = [
  ...documentFields.filter((field) => field.key !== 'document_template_identifier'),
  { key: 'payload', label: 'Payload (JSON)', description: 'The data merged into the template, as a JSON string.' },
  {
    key: 'generation_logs',
    label: 'Generation Logs',
    listItems: [
      { key: 'type', label: 'Type' },
      { key: 'message', label: 'Message' },
      { key: 'timestamp', label: 'Time' },
    ],
  },
];

const templateCardFields: Fields = [
  { key: 'id', label: 'Template ID' },
  { key: 'identifier', label: 'Name' },
  { key: 'output_type', label: 'Output Type' },
  { key: 'edition_mode', label: 'Edition Mode' },
  { key: 'template_folder_id', label: 'Folder ID' },
  { key: 'app_id', label: 'Workspace ID' },
  { key: 'pdf_engine_id', label: 'PDF Engine ID' },
  { key: 'created_at', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
];

export const pdfmonkeySchemas = {
  document: { fields: documentFields },
  wrappedDocument: {
    fields: documentFields.map((field) => ({ ...field, value: `document.${field.value ?? field.key}` })),
  },
  wrappedFullDocument: {
    fields: fullDocumentFields.map((field) => ({ ...field, value: `document.${field.value ?? field.key}` })),
  },
  documentList: {
    fields: [
      { key: 'documents', label: 'Documents', labelKey: 'filename', listItems: documentFields },
      { key: 'page', label: 'Page', format: 'number' },
      { key: 'total_pages', label: 'Total Pages', format: 'number' },
      { key: 'has_more', label: 'Has More', format: 'boolean' },
    ],
  },
  deleted: {
    fields: [
      { key: 'success', label: 'Deleted', format: 'boolean' },
      { key: 'document_id', label: 'Document ID' },
    ],
  },
  legacyDeleted: {
    fields: [
      { key: 'status', label: 'Status' },
      { key: 'message', label: 'Message' },
      { key: 'document_id', label: 'Document ID' },
    ],
  },
  download: {
    fields: [
      { key: 'file', label: 'File', format: 'url', description: 'The downloaded file. Pass it to any step that takes a file.' },
      { key: 'file_name', label: 'File Name' },
      { key: 'size', label: 'Size', format: 'filesize' },
      { key: 'content_type', label: 'Content Type' },
      { key: 'document_id', label: 'Document ID' },
      { key: 'document_template_id', label: 'Template ID' },
      { key: 'document_template_identifier', label: 'Template Name' },
      { key: 'status', label: 'Status' },
    ],
  },
  templateList: {
    fields: [
      {
        key: 'templates',
        label: 'Templates',
        labelKey: 'identifier',
        listItems: [
          ...templateCardFields.filter((field) => field.key !== 'pdf_engine_id'),
          { key: 'template_folder_identifier', label: 'Folder Name' },
          { key: 'pdf_engine_name', label: 'PDF Engine' },
          { key: 'is_draft', label: 'Has Unpublished Changes', format: 'boolean' },
        ],
      },
      { key: 'truncated', label: 'Truncated', format: 'boolean', description: 'True when the list stopped early; there are more templates.' },
    ],
  },
  template: {
    fields: [
      ...templateCardFields,
      { key: 'body_draft', label: 'Draft Body (HTML/Liquid)', format: 'html' },
      { key: 'sample_data', label: 'Sample Data (JSON)', description: 'Published test data: shows which payload fields the template uses.' },
      { key: 'body', label: 'Body (HTML/Liquid)', format: 'html' },
      { key: 'scss_style', label: 'Styles' },
      { key: 'ttl', label: 'Retention (Seconds)', format: 'number' },
      { key: 'preview_url', label: 'Preview URL', format: 'url' },
    ],
  },
  currentUser: {
    fields: [
      { key: 'id', label: 'User ID' },
      { key: 'email', label: 'Email', format: 'email' },
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'company_name', label: 'Company' },
      { key: 'current_plan', label: 'Plan' },
      { key: 'current_plan_interval', label: 'Billing Interval' },
      { key: 'available_documents', label: 'Available Documents', format: 'number', description: 'Documents the account can still generate in the current period.' },
      { key: 'paying_customer', label: 'Paying Customer', format: 'boolean' },
      { key: 'share_links', label: 'Share Links Enabled', format: 'boolean' },
      { key: 'trial_ends_on', label: 'Trial Ends On', format: 'date' },
      { key: 'lang', label: 'Language' },
      { key: 'created_at', label: 'Created At', format: 'datetime' },
    ],
  },
} satisfies Record<string, OutputSchema>;
