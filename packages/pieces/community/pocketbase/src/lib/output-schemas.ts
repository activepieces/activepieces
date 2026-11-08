import { OutputSchema, OutputSchemaField } from '@activepieces/pieces-framework';

const collectionFields: OutputSchemaField[] = [
  { key: 'id', label: 'Collection ID' },
  { key: 'name', label: 'Name' },
  { key: 'type', label: 'Type' },
  { key: 'system', label: 'System', format: 'boolean' },
  { key: 'fields', label: 'Fields' },
  { key: 'indexes', label: 'Indexes' },
  { key: 'listRule', label: 'List Rule' },
  { key: 'viewRule', label: 'View Rule' },
  { key: 'createRule', label: 'Create Rule' },
  { key: 'updateRule', label: 'Update Rule' },
  { key: 'deleteRule', label: 'Delete Rule' },
  { key: 'viewQuery', label: 'View Query' },
  { key: 'authRule', label: 'Auth Rule' },
  { key: 'manageRule', label: 'Manage Rule' },
  { key: 'passwordAuth', label: 'Password Auth' },
  { key: 'oauth2', label: 'OAuth2' },
  { key: 'otp', label: 'OTP' },
  { key: 'mfa', label: 'MFA' },
  { key: 'authAlert', label: 'Auth Alert' },
  { key: 'verificationTemplate', label: 'Verification Email Template' },
  { key: 'resetPasswordTemplate', label: 'Reset Password Email Template' },
  { key: 'confirmEmailChangeTemplate', label: 'Confirm Email Change Template' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'updated', label: 'Updated', format: 'datetime' },
];

const logFields: OutputSchemaField[] = [
  { key: 'id', label: 'Log ID' },
  { key: 'created', label: 'Created', format: 'datetime' },
  { key: 'level', label: 'Level', format: 'number' },
  { key: 'message', label: 'Message' },
  { key: 'data', label: 'Data' },
];

const s3Fields: OutputSchemaField[] = [
  { key: 'enabled', label: 'Enabled', format: 'boolean' },
  { key: 'bucket', label: 'Bucket' },
  { key: 'region', label: 'Region' },
  { key: 'endpoint', label: 'Endpoint', format: 'url' },
  { key: 'accessKey', label: 'Access Key' },
  { key: 'forcePathStyle', label: 'Force Path Style', format: 'boolean' },
];

const pageFields: OutputSchemaField[] = [
  { key: 'page', label: 'Page', format: 'number' },
  { key: 'perPage', label: 'Per Page', format: 'number' },
  { key: 'totalItems', label: 'Total Items', format: 'number' },
  { key: 'totalPages', label: 'Total Pages', format: 'number' },
];

export const pocketbaseSuccessOutputSchema: OutputSchema = {
  fields: [{ key: 'success', label: 'Success', format: 'boolean' }],
};

export const pocketbaseGetListOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Records' }, ...pageFields],
};

export const pocketbaseGetFullListOutputSchema: OutputSchema = {
  fields: [
    { key: 'items', label: 'Records' },
    { key: 'totalItems', label: 'Total Items', format: 'number' },
  ],
};

export const pocketbaseBatchRecordsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'results',
      label: 'Results',
      listItems: [
        { key: 'status', label: 'Status', format: 'number' },
        { key: 'body', label: 'Record' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const pocketbaseListAuthMethodsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'oauth2',
      label: 'OAuth2',
      children: [
        { key: 'enabled', label: 'Enabled', format: 'boolean' },
        { key: 'providers', label: 'Providers' },
      ],
    },
    {
      key: 'mfa',
      label: 'MFA',
      children: [
        { key: 'enabled', label: 'Enabled', format: 'boolean' },
        { key: 'duration', label: 'Duration (seconds)', format: 'number' },
      ],
    },
    {
      key: 'otp',
      label: 'OTP',
      children: [
        { key: 'enabled', label: 'Enabled', format: 'boolean' },
        { key: 'duration', label: 'Duration (seconds)', format: 'number' },
      ],
    },
  ],
};

export const pocketbaseDownloadFileOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'fileName', label: 'File Name' },
  ],
};

export const pocketbaseCollectionOutputSchema: OutputSchema = {
  fields: collectionFields,
};

export const pocketbaseListCollectionsOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Collections', labelKey: 'name', listItems: collectionFields }, ...pageFields],
};

export const pocketbaseCollectionResultOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'collection', label: 'Collection' },
  ],
};

export const pocketbasePreviewViewQueryOutputSchema: OutputSchema = {
  fields: [
    { key: 'fields', label: 'Fields' },
    { key: 'sample', label: 'Sample Row' },
  ],
};

export const pocketbaseSettingsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'meta',
      label: 'App',
      children: [
        { key: 'appName', label: 'App Name' },
        { key: 'appURL', label: 'App URL', format: 'url' },
        { key: 'senderName', label: 'Sender Name' },
        { key: 'senderAddress', label: 'Sender Address', format: 'email' },
        { key: 'hideControls', label: 'Hide Controls', format: 'boolean' },
        { key: 'accentColor', label: 'Accent Color' },
      ],
    },
    {
      key: 'smtp',
      label: 'SMTP',
      children: [
        { key: 'enabled', label: 'Enabled', format: 'boolean' },
        { key: 'host', label: 'Host' },
        { key: 'port', label: 'Port', format: 'number' },
        { key: 'username', label: 'Username' },
        { key: 'authMethod', label: 'Auth Method' },
        { key: 'tls', label: 'TLS', format: 'boolean' },
        { key: 'localName', label: 'Local Name' },
      ],
    },
    { key: 's3', label: 'File Storage S3', children: s3Fields },
    {
      key: 'backups',
      label: 'Backups',
      children: [
        { key: 'cron', label: 'Schedule (cron)' },
        { key: 'cronMaxKeep', label: 'Backups to Keep', format: 'number' },
        { key: 's3', label: 'Backups S3', children: s3Fields },
      ],
    },
    {
      key: 'batch',
      label: 'Batch API',
      children: [
        { key: 'enabled', label: 'Enabled', format: 'boolean' },
        { key: 'maxRequests', label: 'Max Requests', format: 'number' },
        { key: 'timeout', label: 'Timeout (seconds)', format: 'number' },
        { key: 'maxBodySize', label: 'Max Body Size', format: 'filesize' },
      ],
    },
    {
      key: 'logs',
      label: 'Logs',
      children: [
        { key: 'maxDays', label: 'Retention (days)', format: 'number' },
        { key: 'minLevel', label: 'Min Level', format: 'number' },
        { key: 'logIP', label: 'Log IP', format: 'boolean' },
        { key: 'logAuthId', label: 'Log Auth ID', format: 'boolean' },
        { key: 'maxDataSize', label: 'Max Data Size', format: 'number' },
      ],
    },
    {
      key: 'rateLimits',
      label: 'Rate Limits',
      children: [
        { key: 'enabled', label: 'Enabled', format: 'boolean' },
        {
          key: 'rules',
          label: 'Rules',
          labelKey: 'label',
          listItems: [
            { key: 'label', label: 'Label' },
            { key: 'audience', label: 'Audience' },
            { key: 'duration', label: 'Interval (seconds)', format: 'number' },
            { key: 'maxRequests', label: 'Max Requests', format: 'number' },
          ],
        },
        { key: 'excludedIPs', label: 'Excluded IPs' },
      ],
    },
    {
      key: 'trustedProxy',
      label: 'Trusted Proxy',
      children: [
        { key: 'headers', label: 'Headers' },
        { key: 'useLeftmostIP', label: 'Use Leftmost IP', format: 'boolean' },
      ],
    },
    { key: 'superuserIPs', label: 'Superuser IPs' },
  ],
};

export const pocketbaseListLogsOutputSchema: OutputSchema = {
  fields: [{ key: 'items', label: 'Logs', labelKey: 'message', listItems: logFields }, ...pageFields],
};

export const pocketbaseGetLogOutputSchema: OutputSchema = {
  fields: logFields,
};

export const pocketbaseGetLogStatsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'stats',
      label: 'Hourly Counts',
      labelKey: 'date',
      listItems: [
        { key: 'date', label: 'Hour', format: 'datetime' },
        { key: 'total', label: 'Total', format: 'number' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const pocketbaseListBackupsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'backups',
      label: 'Backups',
      labelKey: 'key',
      listItems: [
        { key: 'key', label: 'Key' },
        { key: 'size', label: 'Size', format: 'filesize' },
        { key: 'modified', label: 'Modified', format: 'datetime' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const pocketbaseCreateBackupOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'name', label: 'Name' },
  ],
};

export const pocketbaseBackupResultOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'key', label: 'Key' },
  ],
};

export const pocketbaseDownloadBackupOutputSchema: OutputSchema = {
  fields: [
    { key: 'file', label: 'File', format: 'url' },
    { key: 'key', label: 'Key' },
  ],
};

export const pocketbaseListCronsOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'crons',
      label: 'Cron Jobs',
      labelKey: 'id',
      listItems: [
        { key: 'id', label: 'Job ID' },
        { key: 'expression', label: 'Schedule' },
      ],
    },
    { key: 'count', label: 'Count', format: 'number' },
  ],
};

export const pocketbaseRunCronOutputSchema: OutputSchema = {
  fields: [
    { key: 'success', label: 'Success', format: 'boolean' },
    { key: 'jobId', label: 'Job ID' },
  ],
};

export const pocketbaseRunSqlOutputSchema: OutputSchema = {
  fields: [
    {
      key: 'columns',
      label: 'Columns',
      labelKey: 'name',
      listItems: [
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'nullable', label: 'Nullable', format: 'boolean' },
      ],
    },
    { key: 'rows', label: 'Rows' },
    { key: 'affectedRows', label: 'Affected Rows', format: 'number' },
    { key: 'execTime', label: 'Execution Time (ms)', format: 'number' },
  ],
};
