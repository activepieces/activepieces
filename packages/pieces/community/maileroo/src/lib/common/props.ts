import { Property, spreadIfDefined } from '@activepieces/pieces-framework';

function buildLogFilters(values: LogFilterValues): Record<string, unknown> {
  const { message_id, reference_id, subject, sender, recipient, log_type, sort_dir, datetime_from, datetime_to } = values;
  return {
    ...spreadIfDefined('message_id', message_id),
    ...spreadIfDefined('reference_id', reference_id),
    ...spreadIfDefined('subject', subject),
    ...spreadIfDefined('sender', sender),
    ...spreadIfDefined('recipient', recipient),
    ...spreadIfDefined('log_type', log_type),
    ...spreadIfDefined('sort_dir', sort_dir === undefined ? undefined : Number(sort_dir)),
    ...spreadIfDefined('datetime_from', datetime_from),
    ...spreadIfDefined('datetime_to', datetime_to),
  };
}

export const mailerooProps = {
  tracking: Property.StaticDropdown({
    displayName: 'Open/Click Tracking',
    description: 'Leave unset to use the account setting.',
    required: false,
    options: { disabled: false, options: [{ label: 'Yes', value: 'true' }, { label: 'No', value: 'false' }] },
  }),
  logFilters: {
    message_id: Property.ShortText({ displayName: 'Message ID', description: 'Match a specific message ID.', required: false }),
    reference_id: Property.ShortText({ displayName: 'Reference ID', description: 'Match a reference ID returned by a send action.', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', description: 'Match the subject.', required: false }),
    sender: Property.ShortText({ displayName: 'Sender', description: 'Match the sender address.', required: false }),
    recipient: Property.ShortText({ displayName: 'Recipient', description: 'Match the recipient address.', required: false }),
    log_type: Property.StaticDropdown({
      displayName: 'Event Type',
      description: 'Filter by event type.',
      required: false,
      options: {
        disabled: false,
        options: ['Delivered', 'Deferred', 'Suppressed', 'Bounced', 'Complained'].map((value) => ({ label: value, value })),
      },
    }),
    sort_dir: Property.StaticDropdown({
      displayName: 'Sort Order',
      description: 'Newest first by default.',
      required: false,
      options: { disabled: false, options: [{ label: 'Newest first', value: '-1' }, { label: 'Oldest first', value: '1' }] },
    }),
    datetime_from: Property.Number({ displayName: 'From (Unix Timestamp)', description: 'Only events at or after this Unix timestamp.', required: false }),
    datetime_to: Property.Number({ displayName: 'To (Unix Timestamp)', description: 'Only events at or before this Unix timestamp.', required: false }),
    page: Property.Number({ displayName: 'Page', description: 'Page number, starting at 1.', required: false }),
  },
  buildLogFilters,
};

type LogFilterValues = {
  message_id?: string;
  reference_id?: string;
  subject?: string;
  sender?: string;
  recipient?: string;
  log_type?: string;
  sort_dir?: string;
  datetime_from?: number;
  datetime_to?: number;
};
