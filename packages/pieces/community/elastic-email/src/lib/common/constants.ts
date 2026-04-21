export const ELASTIC_EMAIL_API_BASE = 'https://api.elasticemail.com/v4';

export const CONTACT_STATUS_OPTIONS = [
  'Transactional',
  'Engaged',
  'Active',
  'Bounced',
  'Unsubscribed',
  'Abuse',
  'Inactive',
  'Stale',
  'NotConfirmed',
] as const;

export const CAMPAIGN_STATUS_OPTIONS = [
  'Deleted',
  'Active',
  'Processing',
  'Sending',
  'Completed',
  'Paused',
  'Cancelled',
  'Draft',
] as const;

export const BODY_CONTENT_TYPE_OPTIONS = [
  'HTML',
  'PlainText',
  'AMP',
  'CSS',
] as const;

export const ENCODING_OPTIONS = [
  'UserProvided',
  'None',
  'Raw7bit',
  'Raw8bit',
  'QuotedPrintable',
  'Base64',
  'Uue',
] as const;

export const CONSENT_TRACKING_OPTIONS = [
  'Unknown',
  'Allow',
  'Deny',
] as const;

export const DEFAULT_LIMIT = 100;
