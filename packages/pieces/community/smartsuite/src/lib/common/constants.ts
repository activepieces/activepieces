export const SMARTSUITE_API_URL = 'https://api.smartsuite.com';
export const SMARTSUITE_WEBHOOKS_API_URL = 'https://webhooks.smartsuite.com/smartsuite.webhooks.engine.Webhooks';

export const WEBHOOK_EVENTS = {
  RECORD_CREATED: 'RECORD_CREATED',
  RECORD_UPDATED: 'RECORD_UPDATED',
  RECORD_DELETED: 'RECORD_DELETED',
};

export const API_ENDPOINTS = {
  // Records
  LIST_RECORDS: '/api/v1/solutions/{solutionId}/apps/{appId}/records/list',
  GET_RECORD: '/api/v1/solutions/{solutionId}/apps/{appId}/records/{recordId}',
  CREATE_RECORD: '/api/v1/solutions/{solutionId}/apps/{appId}/records',
  UPDATE_RECORD: '/api/v1/solutions/{solutionId}/apps/{appId}/records/{recordId}',
  DELETE_RECORD: '/api/v1/solutions/{solutionId}/apps/{appId}/records/{recordId}',
  ATTACH_FILE: '/api/v1/solutions/{solutionId}/apps/{appId}/records/{recordId}/fields/{fieldId}/attach',
  GET_FILE_URL: '/api/v1/solutions/{solutionId}/apps/{appId}/records/{recordId}/fields/{fieldId}/files/{fileId}/url',
  
  // Solutions
  LIST_SOLUTIONS: '/api/v1/solutions',
  GET_SOLUTION: '/api/v1/solutions/{solutionId}',
  
  // Tables (Apps)
  LIST_APPS: '/api/v1/solutions/{solutionId}/apps',
  GET_APP: '/api/v1/solutions/{solutionId}/apps/{appId}',
  
  // Webhooks
  CREATE_WEBHOOK: '/CreateWebhook',
  LIST_WEBHOOKS: '/ListWebhooks',
  GET_WEBHOOK: '/GetWebhook',
  UPDATE_WEBHOOK: '/UpdateWebhook',
  DELETE_WEBHOOK: '/DeleteWebhook',
  LIST_EVENTS: '/ListEvents',
};
