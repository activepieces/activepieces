export const SMARTSUITE_API_URL = 'https://app.smartsuite.com/api/v1';
export const SMARTSUITE_WEBHOOKS_API_URL = 'https://webhooks.smartsuite.com/smartsuite.webhooks.engine.Webhooks';

export const WEBHOOK_EVENTS = {
  RECORD_CREATED: 'RECORD_CREATED',
  RECORD_UPDATED: 'RECORD_UPDATED',
  RECORD_DELETED: 'RECORD_DELETED',
};

export const API_ENDPOINTS = {
  // Webhooks
  CREATE_WEBHOOK: '/CreateWebhook',
  LIST_WEBHOOKS: '/ListWebhooks',
  GET_WEBHOOK: '/GetWebhook',
  UPDATE_WEBHOOK: '/UpdateWebhook',
  DELETE_WEBHOOK: '/DeleteWebhook',
  LIST_EVENTS: '/ListEvents',
};
