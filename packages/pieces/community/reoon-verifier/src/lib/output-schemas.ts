import { OutputSchema } from '@activepieces/pieces-framework';

const emailVerificationFields: OutputSchema['fields'] = [
  { key: 'email', label: 'Email', format: 'email' },
  { key: 'domain', label: 'Domain' },
  { key: 'username', label: 'Username' },
  { key: 'status', label: 'Status' },
  { key: 'overall_score', label: 'Overall Score', format: 'number' },
  { key: 'is_valid_syntax', label: 'Valid Syntax', format: 'boolean' },
  { key: 'is_disposable', label: 'Disposable', format: 'boolean' },
  { key: 'is_role_account', label: 'Role Account', format: 'boolean' },
  { key: 'is_free_email', label: 'Free Email Provider', format: 'boolean' },
  { key: 'is_spamtrap', label: 'Spamtrap', format: 'boolean' },
  { key: 'is_forwarded', label: 'Forwarded', format: 'boolean' },
  { key: 'is_catch_all', label: 'Catch-All Domain', format: 'boolean' },
  { key: 'is_disabled', label: 'Disabled', format: 'boolean' },
  { key: 'is_deliverable', label: 'Deliverable', format: 'boolean' },
  { key: 'is_safe_to_send', label: 'Safe To Send', format: 'boolean' },
  { key: 'can_connect_smtp', label: 'Can Connect Via SMTP', format: 'boolean' },
  { key: 'has_inbox_full', label: 'Inbox Full', format: 'boolean' },
  { key: 'mx_accepts_mail', label: 'MX Accepts Mail', format: 'boolean' },
  { key: 'mx_records', label: 'MX Records' },
];

export const verifyEmailActionOutputSchema: OutputSchema = {
  fields: [
    ...emailVerificationFields,
    { key: 'verification_mode', label: 'Verification Mode' },
  ],
};

export const createBulkEmailVerificationActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'status', label: 'Status' },
    { key: 'task_id', label: 'Task ID' },
    { key: 'count_submitted', label: 'Emails Submitted', format: 'number' },
    { key: 'count_processing', label: 'Emails Processing', format: 'number' },
    { key: 'count_rejected_emails', label: 'Emails Rejected', format: 'number' },
    { key: 'count_duplicates_removed', label: 'Duplicates Removed', format: 'number' },
  ],
};

export const getBulkEmailVerificationResultActionOutputSchema: OutputSchema = {
  fields: [
    { key: 'task_id', label: 'Task ID' },
    { key: 'name', label: 'Task Name' },
    { key: 'status', label: 'Status' },
    { key: 'progress_percentage', label: 'Progress Percentage', format: 'number' },
    { key: 'count_total', label: 'Total Emails', format: 'number' },
    { key: 'count_checked', label: 'Emails Checked', format: 'number' },
    {
      key: 'results',
      label: 'Results',
      dynamicKey: true,
      labelKey: 'status',
      children: emailVerificationFields,
    },
  ],
};
