
export const WEALTHBOX_API_BASE = 'https://api.crmworkspace.com/v1';

export const DOCUMENT_TYPES = {
  CONTACT_NOTE: 'ContactNote',
  CONTACT: 'Contact',
  TASK: 'Task',
  EVENT: 'Event',
  OPPORTUNITY: 'Opportunity',
  PROJECT: 'Project'
} as const;

export const EVENT_STATES = {
  UNCONFIRMED: 'unconfirmed',
  CONFIRMED: 'confirmed',
  TENTATIVE: 'tentative',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
} as const;

export const OPPORTUNITY_AMOUNT_KINDS = {
  FEE: 'Fee',
  COMMISSION: 'Commission',
  AUM: 'AUM',
  OTHER: 'Other'
} as const;

export const CURRENCIES = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  AUD: 'A$'
} as const;

export const TASK_PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High'
} as const;

export const LINK_TYPES = {
  CONTACT: 'Contact',
  PROJECT: 'Project',
  OPPORTUNITY: 'Opportunity'
} as const;

export const CONTACT_TYPES = {
  PERSON: 'Person',
  HOUSEHOLD: 'Household',
  ORGANIZATION: 'Organization',
  TRUST: 'Trust'
} as const;

export const CONTACT_CLASSIFICATIONS = {
  CLIENT: 'Client',
  PAST_CLIENT: 'Past Client',
  PROSPECT: 'Prospect',
  VENDOR: 'Vendor',
  ORGANIZATION: 'Organization'
} as const;

export const ORDER_OPTIONS = {
  RECENT: 'recent',
  CREATED: 'created',
  UPDATED: 'updated',
  ASCENDING: 'asc',
  DESCENDING: 'desc'
} as const;
