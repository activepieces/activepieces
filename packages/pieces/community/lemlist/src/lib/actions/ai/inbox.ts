import { HttpMethod } from '@activepieces/pieces-common';
import { createAction, Property } from '@activepieces/pieces-framework';
import { isRecord, lemlistApiCall } from '../../common/client';
import { aiProps } from '../../common/ai-props';
import { lemlistAuth } from '../../common/constants';
import { lemlistInput } from '../../common/input';
import { lemlistResults } from '../../common/results';
import { lemlistSchemas } from '../../common/schemas';

export const getContactMessagesAction = createAction({
  auth: lemlistAuth,
  name: 'get_contact_messages',
  classification: 'READ',
  displayName: 'Get Contact Messages',
  description: 'Returns the inbox conversation with a contact.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Returns the messages exchanged with one contact (contact ID ctc_...) in the lemlist inbox: emails, LinkedIn and other messages with type, date, subject and body. Limit 1-100 (default 50) and Skip for paging; has_more=true means call again with Skip + Limit. Does not mark the conversation as read. Read-only.',
    idempotent: true,
  },
  props: {
    contact_id: Property.ShortText({ displayName: 'Contact ID', required: true }),
    limit: aiProps.limit({ max: 100, fallback: 50 }),
    skip: Property.Number({ displayName: 'Skip', description: 'Messages to skip. Default 0.', required: false }),
  },
  outputSchema: lemlistSchemas.messages,
  async run({ auth, propsValue }) {
    const limit = lemlistInput.boundedInt({ value: propsValue.limit, label: 'Limit', min: 1, max: 100 }) ?? 50;
    const skip = lemlistInput.boundedInt({ value: propsValue.skip, label: 'Skip', min: 0, max: 1_000_000 }) ?? 0;
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: `/inbox/${lemlistInput.segment({ value: propsValue.contact_id, label: 'Contact ID' })}`,
      query: { limit, skip },
    });
    const items = lemlistResults.listFrom({ body });
    const pagination = isRecord(body) ? body['pagination'] : undefined;
    const total = lemlistResults.numberField({ body: pagination, key: 'totalItems' });
    return {
      items,
      count: items.length,
      total: total ?? null,
      has_more: total === undefined ? items.length >= limit : skip + items.length < total,
    };
  },
});

export const sendInboxEmailAction = createAction({
  auth: lemlistAuth,
  name: 'send_inbox_email',
  classification: 'WRITE',
  displayName: 'Send Inbox Email',
  description: 'Sends a real email to a contact from a lemlist mailbox.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Sends a real email right away from a connected lemlist mailbox to a contact or lead, or replies in an existing thread with Reply To Activity ID (reuses its subject and CC). The email cannot be recalled. Only send when the user approved the recipient and the text. Sender user ID, sender email and mailbox ID come from Get Campaign (senders) or Get Team. Not idempotent: each run sends another email.',
    idempotent: false,
  },
  props: {
    send_user_id: Property.ShortText({ displayName: 'Sender User ID', description: 'usr_... of the sender.', required: true }),
    send_user_email: Property.ShortText({ displayName: 'Sender Email', required: true }),
    send_user_mailbox_id: Property.ShortText({ displayName: 'Sender Mailbox ID', description: 'usm_... mailbox ID.', required: true }),
    contact_id: Property.ShortText({ displayName: 'Contact ID', description: 'Recipient contact (ctc_...). Give this or Lead ID.', required: false }),
    lead_id: Property.ShortText({ displayName: 'Lead ID', description: 'Recipient lead (lea_...). Give this or Contact ID.', required: false }),
    subject: Property.ShortText({ displayName: 'Subject', description: 'Required unless replying in a thread.', required: false }),
    message: Property.LongText({ displayName: 'Message', description: 'Email body (HTML allowed).', required: true }),
    cc: Property.Array({ displayName: 'CC', required: false }),
    reply_to_activity_id: Property.ShortText({ displayName: 'Reply To Activity ID', required: false }),
  },
  outputSchema: lemlistSchemas.sentEmail,
  async run({ auth, propsValue }) {
    const contactId = lemlistInput.optionalText(propsValue.contact_id);
    const leadId = lemlistInput.optionalText(propsValue.lead_id);
    if (contactId === undefined && leadId === undefined) {
      throw new Error('Provide the recipient Contact ID or Lead ID.');
    }
    const replyTo = lemlistInput.optionalText(propsValue.reply_to_activity_id);
    const subject = lemlistInput.optionalText(propsValue.subject);
    if (replyTo === undefined && subject === undefined) {
      throw new Error('Subject is required for a new email.');
    }
    const cc =
      propsValue.cc === undefined || propsValue.cc.length === 0
        ? undefined
        : lemlistInput
            .stringList({ value: propsValue.cc, label: 'CC' })
            .map((address) => lemlistInput.email({ value: address, label: 'CC' }));
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/inbox/email',
      body: lemlistInput.compact({
        sendUserId: lemlistInput.requireText({ value: propsValue.send_user_id, label: 'Sender User ID' }),
        sendUserEmail: lemlistInput.email({ value: propsValue.send_user_email, label: 'Sender Email' }),
        sendUserMailboxId: lemlistInput.requireText({ value: propsValue.send_user_mailbox_id, label: 'Sender Mailbox ID' }),
        contactId,
        leadId,
        subject,
        message: lemlistInput.requireText({ value: propsValue.message, label: 'Message' }),
        cc,
        replyToActivityId: replyTo,
      }),
    });
  },
});

export const listLabelsAction = createAction({
  auth: lemlistAuth,
  name: 'list_labels',
  classification: 'SEARCH',
  displayName: 'List Inbox Labels',
  description: 'Lists the inbox labels of the team.',
  audience: 'ai',
  aiMetadata: {
    description: 'Lists every lemlist inbox label of the team (ID, name, color). Returns all labels in one call. Read-only.',
    idempotent: true,
  },
  props: {},
  outputSchema: lemlistSchemas.labels,
  async run({ auth }) {
    const body = await lemlistApiCall<unknown>({
      apiKey: auth.secret_text,
      method: HttpMethod.GET,
      resourceUri: '/inbox/labels',
    });
    const items = lemlistResults.listFrom({ body });
    return { items, count: items.length };
  },
});

export const createLabelAction = createAction({
  auth: lemlistAuth,
  name: 'create_label',
  classification: 'WRITE',
  displayName: 'Create Inbox Label',
  description: 'Creates an inbox label.',
  audience: 'ai',
  aiMetadata: {
    description:
      'Creates a new inbox label for the team. Fails with a conflict when a label with this name exists (check List Inbox Labels first). Not idempotent.',
    idempotent: false,
  },
  props: {
    name: Property.ShortText({ displayName: 'Label Name', required: true }),
  },
  outputSchema: lemlistSchemas.label,
  async run({ auth, propsValue }) {
    return lemlistApiCall({
      apiKey: auth.secret_text,
      method: HttpMethod.POST,
      resourceUri: '/inbox/labels',
      body: { labelName: lemlistInput.requireText({ value: propsValue.name, label: 'Label Name' }) },
    });
  },
});
