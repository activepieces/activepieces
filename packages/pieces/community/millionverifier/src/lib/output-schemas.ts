import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

export const verifyEmailActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'result', label: 'Result' },
    { key: 'subresult', label: 'Sub-Result' },
    { key: 'quality', label: 'Quality' },
    { key: 'resultcode', label: 'Result Code', format: 'number' },
    { key: 'free', label: 'Free Email Provider', format: 'boolean' },
    { key: 'role', label: 'Role Address', format: 'boolean' },
    { key: 'didyoumean', label: 'Did You Mean' },
    { key: 'credits', label: 'Credits Remaining', format: 'number' },
    { key: 'error', label: 'Error' },
  ],
};

const bulkFileFields: OutputSchemaField[] = [
  { key: 'file_id', label: 'File ID' },
  { key: 'file_name', label: 'File Name' },
  { key: 'status', label: 'Status' },
  { key: 'percent', label: 'Percent Complete', format: 'number' },
  { key: 'total_rows', label: 'Total Rows', format: 'number' },
  { key: 'unique_emails', label: 'Unique Emails', format: 'number' },
  { key: 'verified', label: 'Verified', format: 'number' },
  { key: 'unverified', label: 'Unverified', format: 'number' },
  { key: 'ok', label: 'Good', format: 'number' },
  { key: 'catch_all', label: 'Catch-All', format: 'number' },
  { key: 'disposable', label: 'Disposable', format: 'number' },
  { key: 'invalid', label: 'Invalid', format: 'number' },
  { key: 'unknown', label: 'Unknown', format: 'number' },
  { key: 'reverify', label: 'Re-verify', format: 'number' },
  { key: 'credit', label: 'Credits Used', format: 'number' },
  { key: 'estimated_time_sec', label: 'Estimated Time Left (Seconds)', format: 'number' },
  { key: 'createdate', label: 'Created At', format: 'datetime' },
  { key: 'updated_at', label: 'Updated At', format: 'datetime' },
  { key: 'error', label: 'Error' },
];

export const millionverifierVerifyEmailOutputSchema: OutputSchema = {
  fields: [
    { key: 'email', label: 'Email', format: 'email' },
    { key: 'result', label: 'Result' },
    { key: 'subresult', label: 'Sub-Result' },
    { key: 'quality', label: 'Quality' },
    { key: 'resultcode', label: 'Result Code', format: 'number' },
    { key: 'free', label: 'Free Email Provider', format: 'boolean' },
    { key: 'role', label: 'Role Address', format: 'boolean' },
    { key: 'didyoumean', label: 'Did You Mean' },
    { key: 'credits', label: 'Credits Remaining', format: 'number' },
    { key: 'executiontime', label: 'Execution Time (Seconds)', format: 'number' },
    { key: 'livemode', label: 'Live Mode', format: 'boolean' },
    { key: 'error', label: 'Error' },
  ],
};

export const millionverifierGetCreditsOutputSchema: OutputSchema = {
  fields: [
    { key: 'credits', label: 'Credits Remaining', format: 'number' },
    { key: 'bulk_credits', label: 'Bulk Credits Remaining', format: 'number' },
    { key: 'renewing_credits', label: 'Renewing Credits', format: 'number' },
    { key: 'plan', label: 'Plan', format: 'number' },
  ],
};

export const millionverifierBulkFileOutputSchema: OutputSchema = {
  fields: bulkFileFields,
};

export const millionverifierListFilesOutputSchema: OutputSchema = {
  fields: [
    { key: 'files', label: 'Files', labelKey: 'file_name', listItems: bulkFileFields },
    { key: 'total', label: 'Total Matching Files', format: 'number' },
  ],
};

export const millionverifierDownloadReportOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'rows',
      label: 'Rows',
      labelKey: 'email',
      listItems: [
        { key: 'email', label: 'Email', format: 'email' },
        { key: 'result', label: 'Result' },
        { key: 'quality', label: 'Quality' },
        { key: 'free', label: 'Free Email Provider' },
        { key: 'role', label: 'Role Address' },
      ],
    },
    { key: 'count', label: 'Row Count', format: 'number' },
  ],
};

export const millionverifierBulkResultOutputSchema: OutputSchema = {
  fields: [{ key: 'result', label: 'Result' }],
};
