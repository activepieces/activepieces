import { createAction, OutputSchemaField, Property } from '@activepieces/pieces-framework';
import { HttpMethod } from '@activepieces/pieces-common';
import { closeAuth } from '../../auth';
import { closeClient } from '../../common/client';
import { closeMappers } from '../../common/mappers';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subscriptionFields: OutputSchemaField[] = [
  { key: 'id', label: 'Subscription ID', description: 'Close sequence subscription ID (sub_...).' },
  { key: 'sequenceId', label: 'Sequence ID' },
  { key: 'contactId', label: 'Contact ID' },
  { key: 'leadId', label: 'Lead ID' },
  { key: 'contactEmail', label: 'Contact Email', format: 'email' },
  { key: 'senderAccountId', label: 'Sender Account ID' },
  { key: 'senderName', label: 'Sender Name' },
  { key: 'senderEmail', label: 'Sender Email', format: 'email' },
  { key: 'status', label: 'Status', description: 'active, paused, finished, goal, error, ...' },
  { key: 'statusReason', label: 'Status Reason' },
  { key: 'callsAssignedTo', label: 'Calls Assigned To (user IDs)' },
  { key: 'dateCreated', label: 'Created', format: 'datetime' },
  { key: 'dateUpdated', label: 'Updated', format: 'datetime' },
];

function mapSubscription(raw: unknown) {
  const s = closeMappers.recordOf(raw);
  return {
    id: closeMappers.str(s['id']),
    sequenceId: closeMappers.str(s['sequence_id']),
    contactId: closeMappers.str(s['contact_id']),
    leadId: closeMappers.str(s['lead_id']),
    contactEmail: closeMappers.str(s['contact_email']),
    senderAccountId: closeMappers.str(s['sender_account_id']),
    senderName: closeMappers.str(s['sender_name']),
    senderEmail: closeMappers.str(s['sender_email']),
    status: closeMappers.str(s['status']),
    statusReason: closeMappers.str(s['status_reason']),
    callsAssignedTo: closeMappers.arrayOf(s['calls_assigned_to']).filter((v): v is string => typeof v === 'string'),
    dateCreated: closeMappers.str(s['date_created']),
    dateUpdated: closeMappers.str(s['date_updated']),
  };
}

function email({ value, label }: { value: unknown; label: string }): string {
  const text = closeClient.requiredText({ value, label });
  if (!EMAIL_RE.test(text)) throw new Error(`${label} must be an email address.`);
  return text;
}

export const sequenceSubscriptionShape = { fields: subscriptionFields, map: mapSubscription };

export const subscribeContactToSequence = createAction({
  auth: closeAuth,
  name: 'subscribe_contact_to_sequence',
  classification: 'WRITE',
  displayName: 'Subscribe Contact to Sequence',
  description: 'Enroll a contact in a Close sequence (workflow).',
  audience: 'ai',
  aiMetadata: {
    description: 'Subscribes one Close contact (cont_...) to a sequence (seq_..., from List Sequences) so the sequence starts emailing/calling them. Needs the contact email to send to and a sender: email account id (emailacct_...), sender name and sender email, all available from Get Current User. Optional calls assigned to user ids. Returns the new subscription (sub_...). Calling it twice creates a second enrollment or fails, so it is not idempotent.',
    idempotent: false,
  },
  outputSchema: { fields: subscriptionFields },
  props: {
    sequenceId: Property.ShortText({ displayName: 'Sequence ID', required: true }),
    contactId: Property.ShortText({ displayName: 'Contact ID', required: true }),
    contactEmail: Property.ShortText({ displayName: 'Contact Email', required: true }),
    senderAccountId: Property.ShortText({ displayName: 'Sender Email Account ID', description: 'emailacct_... from Get Current User.', required: true }),
    senderName: Property.ShortText({ displayName: 'Sender Name', required: true }),
    senderEmail: Property.ShortText({ displayName: 'Sender Email', required: true }),
    callsAssignedTo: Property.Array({ displayName: 'Calls Assigned To (user IDs)', required: false }),
  },
  async run({ auth, propsValue }) {
    const callsAssignedTo = (closeClient.stringList({ value: propsValue.callsAssignedTo, label: 'Calls Assigned To' }) ?? []).map((value) =>
      closeClient.closeId({ value, label: 'Calls Assigned To', prefix: 'user' }),
    );
    const raw = await closeClient.request({
      auth,
      method: HttpMethod.POST,
      path: '/sequence_subscription/',
      body: {
        sequence_id: closeClient.closeId({ value: propsValue.sequenceId, label: 'Sequence ID', prefix: 'seq' }),
        contact_id: closeClient.closeId({ value: propsValue.contactId, label: 'Contact ID', prefix: 'cont' }),
        contact_email: email({ value: propsValue.contactEmail, label: 'Contact Email' }),
        sender_account_id: closeClient.closeId({ value: propsValue.senderAccountId, label: 'Sender Email Account ID', prefix: 'emailacct' }),
        sender_name: closeClient.requiredText({ value: propsValue.senderName, label: 'Sender Name' }),
        sender_email: email({ value: propsValue.senderEmail, label: 'Sender Email' }),
        ...(callsAssignedTo.length > 0 ? { calls_assigned_to: callsAssignedTo } : {}),
      },
    });
    return mapSubscription(raw);
  },
});
