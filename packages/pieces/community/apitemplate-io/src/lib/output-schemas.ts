import { OutputSchema } from '@activepieces/pieces-framework';

const postActionFields: OutputSchema['fields'] = [
  { key: 'action', label: 'Action' },
  { key: 'name', label: 'Name' },
  { key: 'bucket', label: 'Bucket' },
  { key: 'status', label: 'Status' },
  { key: 'file', label: 'File' },
  { key: 'message', label: 'Message' },
];

export const getAccountInformationOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'subscription_product', label: 'Subscription Product' },
    { key: 'subscription_current_period_start', label: 'Subscription Current Period Start', format: 'datetime' },
    { key: 'subscription_current_period_end', label: 'Subscription Current Period End', format: 'datetime' },
    { key: 'subscription_status', label: 'Subscription Status' },
    { key: 'subscription_interval', label: 'Subscription Interval' },
    { key: 'api_quota', label: 'API Quota', format: 'number' },
    { key: 'api_remaining', label: 'API Remaining', format: 'number' },
    { key: 'api_used', label: 'API Used', format: 'number' },
    { key: 'template_remaining', label: 'Template Remaining', format: 'number' },
    { key: 'template_count', label: 'Template Count', format: 'number' },
    { key: 'template_quota', label: 'Template Quota', format: 'number' },
    { key: 'message', label: 'Message' },
  ],
};

export const deleteObjectOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'transaction_ref', label: 'Transaction Ref' },
  ],
};

export const createImageOutputSchema: OutputSchema = {
  fields: [
    { key: 'download_url', label: 'Download URL', format: 'url' },
    { key: 'transaction_ref', label: 'Transaction Ref' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
    { key: 'status', label: 'Status' },
    { key: 'template_id', label: 'Template ID' },
  ],
};

export const createPdfFromHtmlOutputSchema: OutputSchema = {
  fields: [
    { key: 'download_url', label: 'Download URL', format: 'url' },
    { key: 'transaction_ref', label: 'Transaction Ref' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
    { key: 'status', label: 'Status' },
  ],
};

export const apitemplateIoCreatePdfFromMarkdownOutputSchema: OutputSchema = {
  fields: [
    { key: 'download_url', label: 'Download URL', format: 'url' },
    { key: 'transaction_ref', label: 'Transaction Ref' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
    { key: 'status', label: 'Status' },
    { key: 'post_actions', label: 'Post Actions', labelKey: 'name', listItems: postActionFields },
    { key: 'template_id', label: 'Template ID' },
  ],
};

export const apitemplateIoGetTemplateOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'template_id', label: 'Template ID' },
    { key: 'body', label: 'Body', format: 'html' },
    { key: 'css', label: 'CSS' },
    { key: 'sample_json', label: 'Sample JSON' },
    { key: 'settings', label: 'Settings' },
  ],
};

export const listObjectsOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    {
      key: 'objects',
      label: 'Objects',
      labelKey: 'transaction_ref',
      listItems: [
        { key: 'transaction_ref', label: 'Transaction Ref' },
        { key: 'template_id', label: 'Template ID' },
        { key: 'description', label: 'Description' },
        { key: 'meta', label: 'Meta' },
        { key: 'source', label: 'Source' },
        { key: 'transaction_type', label: 'Transaction Type' },
        { key: 'primary_url', label: 'Primary URL', format: 'url' },
        { key: 'secondary_url', label: 'Secondary URL', format: 'url' },
        { key: 'deleted_at', label: 'Deleted At', format: 'datetime' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
      ],
    },
  ],
};

export const apitemplateIoListTemplatesOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    {
      key: 'templates',
      label: 'Templates',
      labelKey: 'name',
      listItems: [
        { key: 'template_id', label: 'Template ID' },
        { key: 'name', label: 'Name' },
        { key: 'status', label: 'Status' },
        { key: 'format', label: 'Format' },
        { key: 'created_at', label: 'Created At', format: 'datetime' },
        { key: 'updated_at', label: 'Updated At', format: 'datetime' },
        { key: 'group_name', label: 'Group Name' },
      ],
    },
  ],
};

export const apitemplateIoMergePdfsOutputSchema: OutputSchema = {
  fields: [
    { key: 'primary_url', label: 'Primary URL', format: 'url' },
    { key: 'status', label: 'Status' },
    { key: 'transaction_ref', label: 'Transaction Ref' },
    { key: 'total_pages', label: 'Total Pages', format: 'number' },
    { key: 'post_actions', label: 'Post Actions', labelKey: 'name', listItems: postActionFields },
  ],
};

export const apitemplateIoUpdateTemplateOutputSchema: OutputSchema = {
  fields: [{ key: 'status', label: 'Status' }],
};
