export const SMARTSUITE_API_URL = 'https://api.smartsuite.com/v1';
export const SMARTSUITE_WEBHOOKS_API_URL = 'https://webhooks.smartsuite.com/v1';

export const WEBHOOK_EVENTS = {
  RECORD_CREATED: 'record.created',
  RECORD_UPDATED: 'record.updated',
  RECORD_DELETED: 'record.deleted',
  RECORD_RESTORED: 'record.restored',
} as const;

export const API_ENDPOINTS = {
  LIST_SOLUTIONS: '/solutions',
  LIST_TABLES: '/solutions/{solutionId}/apps',
  LIST_RECORDS: '/solutions/{solutionId}/apps/{appId}/records',
  CREATE_RECORD: '/solutions/{solutionId}/apps/{appId}/records',
  UPDATE_RECORD: '/solutions/{solutionId}/apps/{appId}/records/{recordId}',
  DELETE_RECORD: '/solutions/{solutionId}/apps/{appId}/records/{recordId}',
  SEARCH_RECORDS: '/solutions/{solutionId}/apps/{appId}/records/search',
  ATTACH_FILE: '/solutions/{solutionId}/apps/{appId}/records/{recordId}/fields/{fieldId}/files',
  GET_RECORD: '/solutions/{solutionId}/apps/{appId}/records/{recordId}',
  GET_APP: '/solutions/{solutionId}/apps/{appId}',

  // Solutions
  GET_SOLUTION: '/api/v1/solutions/{solutionId}',

  // Webhooks
  CREATE_WEBHOOK: '/CreateWebhook',
  LIST_WEBHOOKS: '/ListWebhooks',
  GET_WEBHOOK: '/GetWebhook',
  UPDATE_WEBHOOK: '/UpdateWebhook',
  DELETE_WEBHOOK: '/DeleteWebhook',
  LIST_EVENTS: '/ListEvents',
  WEBHOOKS: '/webhooks',
  WEBHOOK: '/webhooks/{webhookId}',
  WEBHOOK_EVENTS: '/webhooks/{webhookId}/events',
  WEBHOOK_TEST: '/webhooks/{webhookId}/test',
} as const;

export const FIELD_TYPES = {
  TEXT: 'text',
  EMAIL: 'email',
  URL: 'url',
  PHONE: 'phone',
  NUMBER: 'number',
  DATE: 'date',
  CHECKBOX: 'checkbox',
  LONG_TEXT: 'long_text',
  FILE: 'file',
  SELECT: 'select',
  MULTI_SELECT: 'multi_select',
  RELATION: 'relation',
  FORMULA: 'formula',
  CREATED_AT: 'created_at',
  UPDATED_AT: 'updated_at',
  CREATED_BY: 'created_by',
  UPDATED_BY: 'updated_by',
} as const;

export const ERROR_MESSAGES = {
  // Authentication Errors
  INVALID_API_KEY: 'Invalid API Key',
  AUTHENTICATION_FAILED: 'Authentication failed',
  TOKEN_EXPIRED: 'API token has expired',
  INSUFFICIENT_PERMISSIONS: 'Insufficient permissions to perform this action',

  // Request Errors
  INVALID_REQUEST: 'Invalid request',
  INVALID_PARAMETERS: 'Invalid parameters provided',
  MISSING_REQUIRED_FIELDS: 'Missing required fields',
  INVALID_FIELD_TYPE: 'Invalid field type',
  INVALID_FIELD_VALUE: 'Invalid field value',
  FIELD_VALIDATION_FAILED: 'Field validation failed',

  // Resource Errors
  RESOURCE_NOT_FOUND: 'Resource not found',
  SOLUTION_NOT_FOUND: 'Solution not found',
  TABLE_NOT_FOUND: 'Table not found',
  RECORD_NOT_FOUND: 'Record not found',
  FIELD_NOT_FOUND: 'Field not found',
  WEBHOOK_NOT_FOUND: 'Webhook not found',

  // File Errors
  FILE_TOO_LARGE: 'File is too large',
  INVALID_FILE_FORMAT: 'Invalid file format',
  FILE_UPLOAD_FAILED: 'File upload failed',
  FILE_DELETE_FAILED: 'File delete failed',

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  TOO_MANY_REQUESTS: 'Too many requests',

  // Webhook Errors
  WEBHOOK_CREATION_FAILED: 'Failed to create webhook',
  WEBHOOK_DELETION_FAILED: 'Failed to delete webhook',
  WEBHOOK_UPDATE_FAILED: 'Failed to update webhook',
  INVALID_WEBHOOK_URL: 'Invalid webhook URL',
  WEBHOOK_VERIFICATION_FAILED: 'Webhook verification failed',

  // Field Fetching
  FIELD_FETCH_ERROR: 'Failed to fetch fields',
  FIELD_OPTIONS_FETCH_ERROR: 'Failed to fetch field options',

  // General Errors
  UNKNOWN_ERROR: 'An unknown error occurred',
  NETWORK_ERROR: 'Network error occurred',
  TIMEOUT_ERROR: 'Request timed out',
  SERVER_ERROR: 'Server error occurred',
} as const; 