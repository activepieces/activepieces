export type IMyCaseModel = 'case' | 'client' | 'company' | 'event' | 'lead' | 'message';
export type IMyCaseWebhookAction = 'created' | 'updated' | 'deleted';
export const myCaseBaseUrl = 'https://external-integrations.mycase.com'
export const API_ENDPOINTS = {
  WEBHOOKS: '/webhooks',
  CASE_STAGES: '/case_stages',
  CASES: '/cases',
  CALLS: '/calls',
  PRACTICE_AREAS: '/practice_areas',
  CLIENTS: '/clients',
  COMPANIES: '/companies',
  DOCUMENTS: '/documents',
  LOCATIONS: '/locations',
  LEADS: '/leads',
  EVENTS: '/events',
  CUSTOM_FIELDS: '/custom_fields',
  STAFF: '/staff',
  EXPENSES: '/expenses',
  REFERRAL_SOURCES: '/referral_sources',
  PEOPLE_GROUPS: '/people_groups',
  TASKS: '/task',
  TIME_ENTRIES: '/time_entries',
};