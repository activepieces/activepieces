import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const statusDescription = 'PandaDoc status, for example document.draft, document.sent, document.completed or document.voided.';

const documentSummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Document ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', description: statusDescription },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'date_modified', label: 'Modified At', format: 'datetime' },
  { key: 'date_sent', label: 'Sent At', format: 'datetime' },
  { key: 'date_completed', label: 'Completed At', format: 'datetime' },
  { key: 'expiration_date', label: 'Expires At', format: 'datetime' },
  { key: 'version', label: 'Version' },
];

const recipientFields: OutputSchemaField[] = [
  { key: 'id', label: 'Recipient ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'role', label: 'Role' },
  { key: 'recipient_type', label: 'Recipient Type', description: 'signer, approver or CC.' },
  { key: 'has_completed', label: 'Has Completed', format: 'boolean' },
  { key: 'signing_order', label: 'Signing Order', format: 'number' },
  { key: 'contact_id', label: 'Contact ID' },
  { key: 'shared_link', label: 'Signing Link', format: 'url' },
];

const fieldFields: OutputSchemaField[] = [
  { key: 'uuid', label: 'Field UUID' },
  { key: 'name', label: 'Name' },
  { key: 'merge_field', label: 'Merge Field', description: 'The key to use when prefilling this field.' },
  { key: 'type', label: 'Type' },
  { key: 'value', label: 'Value' },
  { key: 'is_filled', label: 'Is Filled', format: 'boolean' },
  { key: 'assigned_to_email', label: 'Assigned To (Email)', format: 'email' },
  { key: 'assigned_to_role', label: 'Assigned To (Role)' },
];

const tokenFields: OutputSchemaField[] = [
  { key: 'name', label: 'Name' },
  { key: 'value', label: 'Value' },
];

const documentDetailsFields: OutputSchemaField[] = [
  ...documentSummaryFields,
  { key: 'ref_number', label: 'Reference Number' },
  { key: 'folder_uuid', label: 'Folder ID' },
  { key: 'template_id', label: 'Template ID' },
  { key: 'template_name', label: 'Template Name' },
  { key: 'created_by_email', label: 'Created By (Email)', format: 'email' },
  { key: 'sent_by_email', label: 'Sent By (Email)', format: 'email' },
  { key: 'grand_total_amount', label: 'Grand Total' },
  { key: 'grand_total_currency', label: 'Currency' },
  { key: 'tags', label: 'Tags' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
  { key: 'tokens', label: 'Tokens', labelKey: 'name', listItems: tokenFields },
  { key: 'recipients', label: 'Recipients', labelKey: 'email', listItems: recipientFields },
  { key: 'fields', label: 'Fields', labelKey: 'name', listItems: fieldFields },
];

const rawDocumentDetailsFields: OutputSchemaField[] = [
  { key: 'id', label: 'Document ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', description: statusDescription },
  { key: 'ref_number', label: 'Reference Number' },
  { key: 'folder_uuid', label: 'Folder ID' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'date_modified', label: 'Modified At', format: 'datetime' },
  { key: 'date_sent', label: 'Sent At', format: 'datetime' },
  { key: 'date_completed', label: 'Completed At', format: 'datetime' },
  { key: 'expiration_date', label: 'Expires At', format: 'datetime' },
  { key: 'version', label: 'Version' },
  { key: 'template', label: 'Template', children: [
    { key: 'id', label: 'Template ID' },
    { key: 'name', label: 'Template Name' },
  ] },
  { key: 'created_by', label: 'Created By', children: [
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
  ] },
  { key: 'grand_total', label: 'Grand Total', children: [
    { key: 'amount', label: 'Amount' },
    { key: 'currency', label: 'Currency' },
  ] },
  { key: 'tags', label: 'Tags' },
  { key: 'metadata', label: 'Metadata', dynamicKey: true },
  { key: 'tokens', label: 'Tokens', labelKey: 'name', listItems: tokenFields },
  { key: 'recipients', label: 'Recipients', labelKey: 'email', listItems: [
    { key: 'id', label: 'Recipient ID' },
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'first_name', label: 'First Name' },
    { key: 'last_name', label: 'Last Name' },
    { key: 'role', label: 'Role' },
    { key: 'recipient_type', label: 'Recipient Type' },
    { key: 'has_completed', label: 'Has Completed', format: 'boolean' },
    { key: 'signing_order', label: 'Signing Order', format: 'number' },
    { key: 'contact_id', label: 'Contact ID' },
    { key: 'shared_link', label: 'Signing Link', format: 'url' },
  ] },
  { key: 'fields', label: 'Fields', labelKey: 'name', listItems: [
    { key: 'uuid', label: 'Field UUID' },
    { key: 'name', label: 'Name' },
    { key: 'merge_field', label: 'Merge Field' },
    { key: 'type', label: 'Type' },
    { key: 'value', label: 'Value' },
    { key: 'is_filled', label: 'Is Filled', format: 'boolean' },
  ] },
];

const rawCreatedDocumentFields: OutputSchemaField[] = [
  { key: 'id', label: 'Document ID' },
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', description: 'document.uploaded right after creation; document.draft once PandaDoc has processed it.' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'date_modified', label: 'Modified At', format: 'datetime' },
  { key: 'expiration_date', label: 'Expires At', format: 'datetime' },
  { key: 'version', label: 'Version' },
];

const attachmentFields: OutputSchemaField[] = [
  { key: 'uuid', label: 'Attachment ID' },
  { key: 'name', label: 'Name' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'type', label: 'Type' },
];

const contactFields: OutputSchemaField[] = [
  { key: 'id', label: 'Contact ID' },
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'first_name', label: 'First Name' },
  { key: 'last_name', label: 'Last Name' },
  { key: 'company', label: 'Company' },
  { key: 'job_title', label: 'Job Title' },
  { key: 'phone', label: 'Phone' },
  { key: 'street_address', label: 'Street Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'postal_code', label: 'Postal Code' },
  { key: 'country', label: 'Country' },
];

const templateSummaryFields: OutputSchemaField[] = [
  { key: 'id', label: 'Template ID' },
  { key: 'name', label: 'Name' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
  { key: 'date_modified', label: 'Modified At', format: 'datetime' },
  { key: 'version', label: 'Version' },
];

const folderFields: OutputSchemaField[] = [
  { key: 'uuid', label: 'Folder ID' },
  { key: 'name', label: 'Name' },
  { key: 'date_created', label: 'Created At', format: 'datetime' },
];

const webhookEventFields: OutputSchemaField[] = [
  { key: 'event', label: 'Event', description: 'PandaDoc webhook event, for example document_state_changed.' },
  ...documentDetailsFields,
  { key: 'action_by_email', label: 'Action By (Email)', format: 'email' },
  { key: 'action_by_first_name', label: 'Action By (First Name)' },
  { key: 'action_by_last_name', label: 'Action By (Last Name)' },
  { key: 'action_date', label: 'Action Date', format: 'datetime' },
];

export const pandadocSchemas: Record<string, OutputSchema> = {
  rawCreatedDocument: { fields: rawCreatedDocumentFields },
  rawDocumentDetails: { fields: rawDocumentDetailsFields },
  rawFindDocuments: {
    fields: [
      { key: 'results', label: 'Documents', labelKey: 'name', listItems: documentSummaryFields },
    ],
  },
  rawAttachment: {
    fields: [
      ...attachmentFields,
      { key: 'created_by', label: 'Created By', children: [
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'first_name', label: 'First Name' },
        { key: 'last_name', label: 'Last Name' },
      ] },
    ],
  },
  rawContact: { fields: contactFields },
  downloadedFile: {
    fields: [
      { key: 'file', label: 'File', format: 'url' },
      { key: 'file_name', label: 'File Name' },
      { key: 'protected', label: 'Protected Copy', format: 'boolean' },
    ],
  },
  createdDocument: { fields: [...documentSummaryFields] },
  documentDetails: { fields: documentDetailsFields },
  documentList: {
    fields: [
      { key: 'documents', label: 'Documents', labelKey: 'name', listItems: documentSummaryFields },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  sentDocument: {
    fields: [
      ...documentSummaryFields,
      { key: 'recipients', label: 'Recipients', labelKey: 'email', listItems: recipientFields },
    ],
  },
  signingLink: {
    fields: [
      { key: 'url', label: 'Signing Link', format: 'url' },
      { key: 'session_id', label: 'Session ID' },
      { key: 'expires_at', label: 'Expires At', format: 'datetime' },
      { key: 'document_id', label: 'Document ID' },
      { key: 'recipient_email', label: 'Recipient Email', format: 'email' },
    ],
  },
  reminder: {
    fields: [
      { key: 'document_id', label: 'Document ID' },
      { key: 'results', label: 'Results', labelKey: 'recipient_id', listItems: [
        { key: 'recipient_id', label: 'Recipient ID' },
        { key: 'email_status', label: 'Email Status' },
        { key: 'email_detail', label: 'Email Detail' },
        { key: 'sms_status', label: 'SMS Status' },
        { key: 'sms_detail', label: 'SMS Detail' },
      ] },
    ],
  },
  statusChange: {
    fields: [
      { key: 'id', label: 'Document ID' },
      { key: 'status', label: 'New Status', description: statusDescription },
      { key: 'previous_status', label: 'Previous Status' },
    ],
  },
  deleted: {
    fields: [
      { key: 'id', label: 'ID' },
      { key: 'deleted', label: 'Deleted', format: 'boolean' },
      { key: 'already_deleted', label: 'Was Already Deleted', format: 'boolean' },
    ],
  },
  moved: {
    fields: [
      { key: 'id', label: 'Document ID' },
      { key: 'folder_id', label: 'Folder ID' },
      { key: 'moved', label: 'Moved', format: 'boolean' },
    ],
  },
  recipientAdded: {
    fields: [
      { key: 'document_id', label: 'Document ID' },
      { key: 'contact_id', label: 'Contact ID' },
      { key: 'recipient_id', label: 'Recipient ID' },
    ],
  },
  fieldList: {
    fields: [
      { key: 'document_id', label: 'Document ID' },
      { key: 'fields', label: 'Fields', labelKey: 'name', listItems: fieldFields },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  templateList: {
    fields: [
      { key: 'templates', label: 'Templates', labelKey: 'name', listItems: templateSummaryFields },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  templateDetails: {
    fields: [
      ...templateSummaryFields,
      { key: 'folder_uuid', label: 'Folder ID' },
      { key: 'tags', label: 'Tags' },
      { key: 'roles', label: 'Roles', labelKey: 'name', listItems: [
        { key: 'id', label: 'Role ID' },
        { key: 'name', label: 'Role Name', description: 'Use this as the recipient role when creating a document.' },
        { key: 'signing_order', label: 'Signing Order', format: 'number' },
      ] },
      { key: 'fields', label: 'Fields', labelKey: 'name', listItems: fieldFields },
      { key: 'tokens', label: 'Tokens', labelKey: 'name', listItems: tokenFields },
    ],
  },
  folderList: {
    fields: [
      { key: 'folders', label: 'Folders', labelKey: 'name', listItems: [
        ...folderFields,
        { key: 'has_folders', label: 'Has Subfolders', format: 'boolean' },
        { key: 'has_items', label: 'Has Documents', format: 'boolean' },
      ] },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  folder: {
    fields: [...folderFields, { key: 'parent_uuid', label: 'Parent Folder ID' }],
  },
  contact: { fields: contactFields },
  contactList: {
    fields: [
      { key: 'contacts', label: 'Contacts', labelKey: 'email', listItems: contactFields },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  attachment: { fields: [...attachmentFields, { key: 'created_by_email', label: 'Created By (Email)', format: 'email' }] },
  attachmentList: {
    fields: [
      { key: 'document_id', label: 'Document ID' },
      { key: 'attachments', label: 'Attachments', labelKey: 'name', listItems: [...attachmentFields, { key: 'created_by_email', label: 'Created By (Email)', format: 'email' }] },
      { key: 'count', label: 'Count', format: 'number' },
    ],
  },
  aiDownloadedFile: {
    fields: [
      { key: 'file', label: 'File', format: 'url' },
      { key: 'file_name', label: 'File Name' },
      { key: 'protected', label: 'Protected Copy', format: 'boolean' },
      { key: 'document_id', label: 'Document ID' },
    ],
  },
  webhookEvent: { fields: webhookEventFields },
  creationFailedEvent: {
    fields: [
      { key: 'event', label: 'Event' },
      { key: 'id', label: 'Document ID' },
      { key: 'error_type', label: 'Error Type', description: 'For example validation_error.' },
      { key: 'error_detail', label: 'Error Detail', description: 'Why PandaDoc could not create the document.' },
    ],
  },
};
