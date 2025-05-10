export const KOMMO_API_BASE_URL = 'https://{subdomain}.kommo.com/api/v4';

export const KOMMO_OAUTH_URLS = {
  authorizeUrl: 'https://www.kommo.com/oauth',
};

export const KOMMO_WEBHOOK_EVENTS = {
  LEAD_ADDED: 'add',
  LEAD_STATUS_CHANGED: 'status',
  CONTACT_ADDED: 'add',
  TASK_COMPLETED: 'update',
};

export const KOMMO_ENTITIES = {
  LEAD: 'leads',
  CONTACT: 'contacts',
  COMPANY: 'companies',
  TASK: 'tasks',
};
